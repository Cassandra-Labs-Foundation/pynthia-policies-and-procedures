```yaml
---
title: Enterprise Risk Management Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2025-07-01
next_review: 2026-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Enterprise Risk Management, ERM, Risk Appetite, Risk Register, KRI]
---
```

## General Policy Statement

Pynthia Credit Union manages risk deliberately and transparently across all material risk types — financial, operational, compliance, technology, model, strategic, and reputational — through a structured enterprise risk management framework aligned to the three lines of defense. This Framework establishes how the Credit Union defines and maintains its risk appetite, scores risks consistently using a 5×5 likelihood/impact matrix, escalates and remediates appetite breaches, and sustains a living enterprise risk register. It does not enumerate specific risks, limits, or thresholds; those live in separate risk appetite statements, registers, and committee charters that must conform to this Framework. Governance is centralized with the Chief Compliance Officer, with oversight from the Management Risk Committee, Board Risk Committee, Board of Directors, and Internal Audit.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Risk Appetite Statement — annual review | Calendar anniversary of effective date (`risk_appetite.review_window.opened`) | Annual | Full RAS document + structured data per category | [ERM-01](#erm-01-enterprise-risk-appetite-statement) |
| Risk Appetite Statement — material strategic change | Strategy material change declared (`strategy.material_change.declared`) | 90 calendar days | Full RAS re-review | [ERM-01](#erm-01-enterprise-risk-appetite-statement) |
| Risk Appetite Statement — advance warning | 30 days before next review date (`risk_appetite.review_due_at`) | 30 days prior | System flag to owner | [ERM-01](#erm-01-enterprise-risk-appetite-statement) |
| Risk Taxonomy — annual review | Calendar anniversary (`taxonomy.review_due_at`) | Annual | Canonical category/subcategory list | [ERM-02](#erm-02-risk-taxonomy--categories) |
| Risk Taxonomy — new product/business line | Product or business line added (`product.line.added`) | Before go-live | Updated taxonomy version | [ERM-02](#erm-02-risk-taxonomy--categories) |
| Risk Scoring Matrix — periodic review | Every 3 years or major change (`risk_scale.review_due_at`) | 3 years / on change | 5×5 matrix definition + band labels | [ERM-03](#erm-03-risk-scoring-matrix--rating-scale) |
| Risk Register — High/Very High reassessment | Quarterly calendar trigger (`risk.reassessment_due_at`) | Quarterly | Updated residual rating + controls | [ERM-04](#erm-04-risk-assessment--register-maintenance) |
| Risk Register — Moderate reassessment | Annual calendar trigger (`risk.assessment_due_at`) | Annual | Updated residual rating + controls | [ERM-04](#erm-04-risk-assessment--register-maintenance) |
| Risk Register — Low/Very Low reassessment | Biennial calendar trigger or trigger event | 2 years / on trigger | Updated residual rating + controls | [ERM-04](#erm-04-risk-assessment--register-maintenance) |
| KRI — stale data flag | 1.5× expected refresh interval elapsed (`kri.stale.flagged`) | 1.5× interval | KRI value + data source | [ERM-05](#erm-05-key-risk-indicators--thresholds) |
| Breach — Major/Critical triage & CRO notification | Breach detected (`risk_breach.detected`) | 1 business day | Breach record + severity + triage | [ERM-06](#erm-06-risk-appetite-breach-escalation--incident-management) |
| Breach — committee presentation | Breach opened (`risk_breach.opened`) | 30 calendar days | Breach record + remediation plan | [ERM-06](#erm-06-risk-appetite-breach-escalation--incident-management) |
| Breach — monthly status review | Monthly calendar trigger (`risk_breach.review_due_at`) | Monthly until closed | Breach status update | [ERM-06](#erm-06-risk-appetite-breach-escalation--incident-management) |
| Risk Acceptance — decision | Request submitted (`risk_acceptance.requested`) | 30 calendar days | Acceptance record with expiry date | [ERM-07](#erm-07-risk-acceptance--exceptions) |
| Risk Acceptance — expiry alert (30-day) | 30 days before expiry (`risk_acceptance.expiry_alert_at`) | 30 days prior | Alert to owner and approver | [ERM-07](#erm-07-risk-acceptance--exceptions) |
| Risk Acceptance — expiry alert (7-day) | 7 days before expiry (`risk_acceptance.expiry_warning`) | 7 days prior | Alert to owner and approver | [ERM-07](#erm-07-risk-acceptance--exceptions) |
| Risk Acceptance — lapse → breach | Expiry date reached with no renewal (`risk_acceptance.expired`) | Immediately | Breach record created | [ERM-07](#erm-07-risk-acceptance--exceptions) |
| Management risk report | Monthly calendar trigger (`risk_report.management_due_at`) | Monthly | Heatmap, top risks, breach/acceptance summary, KRI trends | [ERM-08](#erm-08-risk-reporting--governance-oversight) |
| Board/BRC risk report | Quarterly calendar trigger (`risk_report.board_due_at`) | Quarterly | Full board risk package with drill-down | [ERM-08](#erm-08-risk-reporting--governance-oversight) |

---

## ERM-01 — Enterprise Risk Appetite Statement {#erm-01-enterprise-risk-appetite-statement}

**WHY (Reg cite):** [12 CFR §741.3 and Appendix A to Part 741](https://www.ecfr.gov/current/title-12/part-741) require federally insured credit unions to maintain written risk management programs; NCUA Examiner's Guide ERM guidance expects a documented, Board-approved risk appetite statement as a foundational element of enterprise risk governance. A single authoritative statement prevents conflicting appetite signals across business lines and gives examiners a clear reference point.

**SYSTEM BEHAVIOR:** The GRC system maintains exactly one active `risk_appetite` record at any time. Each version carries `risk_appetite.version`, `risk_appetite.effective_date`, `risk_appetite.next_review_date`, and a structured data block per risk category (financial, operational, compliance, technology, model, strategic, reputational) embedded in `risk_appetite.document`. The system enforces write-restriction on the active record to the Chief Compliance Officer and Board-authorized approvers; all other roles are read-only. When a new version is approved, the prior version is archived with its approval history intact. The system sets `risk_appetite.review_due_at` to the next annual anniversary and `risk_appetite.rereview_due_at` to 90 calendar days after any `strategy.material_change.declared` event. A 30-day advance flag (`risk_appetite.review_window.opened`) is emitted automatically when the review date is 30 days out. CRO-level exemption from the 90-day re-review window must be documented in the record.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual review date approaches — 30 days out (`risk_appetite.review_window.opened`) | Current `risk_appetite.version`, `risk_appetite.next_review_date`, owner identity (`user.id`) | System flag and task assigned to CCO (`risk_appetite.review.flagged`) | 30 days before review date (enforced by `risk_appetite.review_due_at`) |
| Board approves updated Risk Appetite Statement (`risk_appetite.approved`) | Draft document (`risk_appetite.document`), structured category data, approver identity (`user.id`), effective date (`risk_appetite.effective_date`), next review date (`risk_appetite.next_review_date`) | New versioned RAS record published; prior version archived (`risk_appetite.version.published`) | Same session as Board approval |
| Material strategic change declared (`strategy.material_change.declared`) | Change summary (`strategy.change_summary`), declaration date | Re-review task created; `risk_appetite.rereview_due_at` set to 90 calendar days out (`risk_appetite.rereview.opened`) | Within 1 business day of declaration (re-review due within 90 calendar days; enforced by `risk_appetite.rereview_due_at`) |

**ALERTS/METRICS:** Alert fires when `risk_appetite.review_due_at` is breached without a new approved version (target: zero overdue reviews). Secondary alert fires when `risk_appetite.rereview_due_at` is breached following a material strategic change. Dashboard shows days-since-last-approval and version history count.

---

## ERM-02 — Risk Taxonomy & Categories {#erm-02-risk-taxonomy--categories}

**WHY (Reg cite):** [12 CFR §741.3 and Appendix A to Part 741](https://www.ecfr.gov/current/title-12/part-741) require identification and measurement of all material risks; consistent categorization is a prerequisite for comparable measurement. NCUA ERM guidance expects a defined risk taxonomy as the backbone of the enterprise risk program. Without a canonical taxonomy, risk, KRI, and incident records cannot be aggregated or compared across the institution.

**SYSTEM BEHAVIOR:** The GRC system maintains a single active `taxonomy` record with `taxonomy.active_version`, `taxonomy.category_code`, and `taxonomy.subcategory_code` covering the seven canonical categories (financial, operational, compliance, technology, model, strategic, reputational). Every `risk`, `kri`, and `incident` record must reference a valid `taxonomy.category_code` and `taxonomy.subcategory_code` from the active version; the system blocks save if the selection is absent or invalid. Taxonomy changes require a change request (`taxonomy.change_request`) reviewed by the CCO before publication. The taxonomy is reviewed at least annually and whenever a new product type or business line is added; `taxonomy.review_due_at` is set to the annual anniversary. Write access is restricted to the CCO and designated Risk Management staff.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual review date reached (`taxonomy.review_due_at`) | Current `taxonomy.active_version`, category/subcategory list | Review task assigned; outcome recorded (`taxonomy.version.published` if changes made, else review logged with no change) | Annual (enforced by `taxonomy.review_due_at`) |
| New product type or business line added (`product.line.added`) | Product description, proposed risk categories affected | Taxonomy review task created; updated version published if new categories required (`taxonomy.version.published`) | Before product go-live |
| Risk, KRI, or incident record saved without valid taxonomy code | Attempted record payload, missing `taxonomy.category_code` or `taxonomy.subcategory_code` | System validation rejection (`taxonomy.validation.rejected`); record not saved | Immediate (blocking) |
| Taxonomy change request submitted | Change rationale (`taxonomy.change_request`), proposed category/subcategory additions or modifications | Change reviewed and approved or rejected; new version published (`taxonomy.version.published`) | Before next affected record is created |

**ALERTS/METRICS:** Alert fires on any `taxonomy.validation.rejected` event (target: zero); metric tracks count of risk/KRI/incident records with missing taxonomy codes (target: zero). Dashboard shows taxonomy version currency and days since last review.

---

## ERM-03 — Risk Scoring Matrix & Rating Scale {#erm-03-risk-scoring-matrix--rating-scale}

**WHY (Reg cite):** [12 CFR §741.3 and Appendix A to Part 741](https://www.ecfr.gov/current/title-12/part-741) require measurement of risk; NCUA ERM guidance expects a consistent, documented methodology for rating risks. A standardized 5×5 matrix ensures that risks scored by different business units or at different times are comparable, enabling meaningful aggregation and Board-level reporting.

**SYSTEM BEHAVIOR:** The GRC system maintains a single active `risk_scale` record with `risk_scale.version`, `risk_scale.definition` (the full 5×5 matrix with numeric scores 1–25 and qualitative band labels: Very Low, Low, Moderate, High, Very High), and `risk_scale.review_due_at` set to three years from the last approval date. All enterprise risk assessments must use the active scale; the system enforces selection from the active `risk_scale.version` and blocks assessments that reference a retired version. CRO-granted exemptions from the standard scale are recorded in `risk_scale.exemption_id` and `risk_scale.exemption_rationale` with the alternative method documented in `risk_scale.alternative_method`; exemptions do not suppress the audit record. The scale is reviewed at least every three years and on any major methodology change. Write access to the active scale definition is restricted to the CCO and CRO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Three-year review date reached or major change identified (`risk_scale.review_due_at`) | Current `risk_scale.version`, `risk_scale.definition`, `risk_scale.usage_stats` | Review completed; updated version published or existing version reaffirmed (`risk_scale.version.published`) | Every 3 years or on major change (enforced by `risk_scale.review_due_at`) |
| Risk assessment submitted using non-active scale version | Assessment payload referencing retired `risk_scale.version` | System validation rejection; assessment blocked until corrected (`taxonomy.validation.rejected` pattern — blocking save) | Immediate (blocking) |
| CRO grants exemption from standard scale | Exemption rationale (`risk_scale.exemption_rationale`), alternative method (`risk_scale.alternative_method`), CRO identity (`user.id`) | Exemption recorded and linked to the affected assessment (`risk_scale.exemption.recorded`) | Same session as exemption grant |

**ALERTS/METRICS:** Alert fires when `risk_scale.review_due_at` is breached without a published new version (target: zero overdue). Metric tracks count of active assessments referencing a non-current scale version (target: zero). Exemption count is reported monthly to the CCO.

---

## ERM-04 — Risk Assessment & Register Maintenance {#erm-04-risk-assessment--register-maintenance}

**WHY (Reg cite):** [12 CFR §741.3 and Appendix A to Part 741](https://www.ecfr.gov/current/title-12/part-741) require identification, measurement, monitoring, and control of all material risks. NCUA ERM guidance expects a centralized risk register as the authoritative inventory of material risks. A living register with defined reassessment cadences ensures that the Board and management always see a current, complete picture of the institution's risk profile.

**SYSTEM BEHAVIOR:** The GRC system maintains a centralized enterprise risk register where each entry is a `risk` record with fields including `risk.id`, `risk.description`, `risk.owner_id`, `risk.likelihood_score`, `risk.impact_score`, `risk.inherent_score`, `risk.residual_rating`, `risk.last_assessed_at`, `risk.reassessment_due_at`, `risk.assessment_results`, and `risk.remediation_evidence`. Lifecycle states (e.g., identified, assessed, accepted, closed) are tracked via `risk.registered` and `risk.reassessed`. The system automatically sets `risk.reassessment_due_at` based on residual rating: quarterly for High/Very High, annually for Moderate, and biennially for Low/Very Low. Trigger events (new product, significant loss, regulatory finding, material control failure) reset the reassessment clock regardless of rating. The system flags any risk record with no `risk.owner_id` (`risk.ownership_gap.detected`) and any record where `risk.reassessment_due_at` has passed without a completed assessment (`risk.review_overdue`). Write access to risk ratings is restricted to Risk Management (second line); business line owners may update descriptive fields and control evidence only.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Reassessment due date reached for any risk (`risk.reassessment_due_at`) | `risk.id`, `risk.residual_rating`, `risk.owner_id`, current control inventory (`risk.assessment_results`) | Assessment completed; updated scores and rating recorded; new `risk.reassessment_due_at` set (`risk.assessment.completed`) | Quarterly (High/Very High), Annual (Moderate), Biennial (Low/Very Low) — enforced by `risk.reassessment_due_at` |
| Trigger event occurs (new product, significant loss, regulatory finding) (`product.line.added` or `incident.created` or `finding.opened`) | Trigger event reference, affected `risk.id` list | Reassessment task created; `risk.reassessment_due_at` reset to trigger-based deadline (`risk.assessment.published`) | Within 5 business days of trigger event |
| Risk record created with no owner assigned | `risk.id`, `risk.description`, `taxonomy.category_code` | Ownership gap flagged; task assigned to CCO to designate owner (`risk.ownership_gap.detected`) | Immediate on save |
| Reassessment due date passes without completed assessment | `risk.id`, `risk.reassessment_due_at`, `risk.owner_id` | Overdue flag set; escalation to CCO (`risk.review_overdue`) | Day after `risk.reassessment_due_at` |

**ALERTS/METRICS:** Aging alert fires for any risk where `risk.reassessment_due_at` is within 14 days and no assessment is in progress (target: zero overdue). Separate alert for any risk with no owner (`risk.ownership_gap.detected`; target: zero). Dashboard shows register completeness rate and count of overdue assessments by rating band.

---

## ERM-05 — Key Risk Indicators & Thresholds {#erm-05-key-risk-indicators--thresholds}

**WHY (Reg cite):** [12 CFR §741.3 and Appendix A to Part 741](https://www.ecfr.gov/current/title-12/part-741) require ongoing monitoring of risk; NCUA ERM guidance expects forward-looking indicators linked to appetite. KRIs provide the early-warning signal that a risk is moving toward or beyond appetite before a breach occurs, enabling proactive management rather than reactive response.

**SYSTEM BEHAVIOR:** Each `kri` record is linked to one or more `risk` records and carries `kri.thresholds` (green/amber/red bands aligned to the active `risk_appetite` for that category), `kri.direction` (increasing/decreasing risk), `kri.refresh_interval` (the expected update frequency), `kri.data_source`, `kri.value`, and `kri.observed_at`. The system evaluates each KRI against its thresholds on every data refresh and records the result in `kri.status_evaluated`. If no update is received within 1.5× the configured `kri.refresh_interval`, the system sets `kri.data_stale` and emits `kri.stale.flagged`. KRI thresholds must be reviewed and confirmed aligned to the current appetite whenever the RAS is updated. Write access to threshold definitions is restricted to Risk Management (second line); data feeds may be updated by authorized data owners.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| KRI data refresh received (`kri.observation.received`) | `kri.value`, `kri.observed_at`, `kri.data_source`, `kri.thresholds`, linked `risk.id` | KRI status evaluated against thresholds; trend updated; result recorded (`kri.version.published`) | At configured `kri.refresh_interval` |
| KRI value crosses amber or red threshold (`kri.observation.received` with value outside green band) | `kri.value`, `kri.thresholds`, `kri.direction`, linked `risk.id`, `risk.owner_id` | Threshold breach alert issued to risk owner and CCO; escalation task created if red (`risk_breach.detected` if red threshold crossed) | Immediate on data receipt |
| 1.5× refresh interval elapsed without new data (`kri.staleness_check_at`) | `kri.refresh_interval`, `kri.observed_at`, `kri.data_source` | Stale data flag set; alert to data owner and CCO (`kri.stale.flagged`) | At 1.5× `kri.refresh_interval` (enforced by `kri.staleness_check_at`) |
| RAS updated and approved (`risk_appetite.approved`) | Updated `risk_appetite.document`, category thresholds, linked `kri.id` list | KRI threshold review task created for each affected KRI; updated thresholds recorded after review (`kri.thresholds.updated`) | Within 30 calendar days of RAS approval |

**ALERTS/METRICS:** Alert fires for every `kri.stale.flagged` event (target: zero stale KRIs at any reporting date). Dashboard shows count of KRIs in amber and red status, trend direction, and staleness rate. Amber/red KRI counts are included in every management and Board risk report.

---

## ERM-06 — Risk Appetite Breach Escalation & Incident Management {#erm-06-risk-appetite-breach-escalation--incident-management}

**WHY (Reg cite):** [12 CFR §741.3 and Appendix A to Part 741](https://www.ecfr.gov/current/title-12/part-741) require monitoring and control of risk; NCUA ERM guidance expects a defined escalation process when risk positions exceed appetite. Timely escalation ensures that the CRO and Board are informed before a breach compounds, and that remediation is tracked to closure.

**SYSTEM BEHAVIOR:** When a position is detected outside appetite — whether from a KRI red-threshold crossing, a risk reassessment producing a residual rating above the appetite ceiling, or a manual identification — the system creates a `risk_breach` record with `risk_breach.id`, `risk_breach.severity` (Minor, Moderate, Major, Critical), `risk_breach.current_excursion`, `risk_breach.excursion_size`, `risk_breach.impact_summary`, and `risk_breach.remediation_plan`. For Major and Critical breaches, `risk_breach.triage_due_at` is set to 1 business day and `risk_breach.committee_due_at` is set to 30 calendar days. The system enforces a monthly review cycle for all open breaches by setting `risk_breach.review_due_at` to 30 days after the last review until `risk_breach.closed`. Breach records are write-restricted to Risk Management and the CCO; business line owners may add remediation evidence only. Minor and Moderate breaches follow the same workflow with extended triage windows defined in the supporting procedures (out of scope for this Framework).

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Position detected outside appetite (KRI red threshold or assessment above ceiling) (`risk_breach.detected`) | Triggering `kri.value` or `risk.residual_rating`, `risk_appetite.document` (applicable limit), `risk.owner_id`, `taxonomy.category_code` | Breach record created with severity classification; triage task assigned (`risk_breach.opened`) | Immediate on detection |
| Major/Critical breach triage and CRO notification (`risk_breach.triage_due_at`) | `risk_breach.id`, `risk_breach.severity`, `risk_breach.current_excursion`, `risk_breach.impact_summary`, CRO identity (`user.id`) | Triage completed; CRO notified (`risk_breach.cro.notified`) | 1 business day (enforced by `risk_breach.triage_due_at`) |
| Major/Critical breach committee presentation (`risk_breach.committee_due_at`) | `risk_breach.id`, `risk_breach.remediation_plan`, `risk_breach.remediation_status`, committee meeting record | Breach presented to Management Risk Committee or Board Risk Committee as appropriate (`risk_breach.committee.presented`) | 30 calendar days from breach opening (enforced by `risk_breach.committee_due_at`) |
| Monthly breach status review (`risk_breach.review_due_at`) | `risk_breach.id`, `risk_breach.remediation_status`, `risk_breach.remediation_plan` | Status review recorded; `risk_breach.review_due_at` reset to next month (`risk_breach.status.reviewed`) | Monthly until `risk_breach.closed` (enforced by `risk_breach.review_due_at`) |
| Breach remediated and closed | `risk_breach.remediation_status` = complete, closure evidence, CCO sign-off | Breach record closed; closure logged (`risk_breach.closed`) | Upon confirmed remediation |

**ALERTS/METRICS:** Alert fires if `risk_breach.triage_due_at` is breached for any Major/Critical breach (target: zero late triages). Alert fires if `risk_breach.committee_due_at` is breached (target: zero). Dashboard shows open breach count by severity, average days-to-triage, and average days-to-committee-presentation.

---

## ERM-07 — Risk Acceptance & Exceptions {#erm-07-risk-acceptance--exceptions}

**WHY (Reg cite):** [12 CFR §741.3 and Appendix A to Part 741](https://www.ecfr.gov/current/title-12/part-741) require documented risk management decisions; NCUA ERM guidance expects that residual risks accepted above appetite are formally documented with accountability and time limits. Indefinite acceptances obscure the true risk profile and undermine appetite discipline.

**SYSTEM BEHAVIOR:** A `risk_acceptance` record is created for each request, carrying `risk_acceptance.id`, `risk_acceptance.owner_id`, `risk_acceptance.rationale`, `risk_acceptance.expiry_date` (mandatory; no indefinite acceptances are permitted — the system blocks save if `risk_acceptance.expiry_date` is absent), `risk_acceptance.decision_due_at` (set to 30 calendar days from `risk_acceptance.requested`), `risk_acceptance.expiry_alert_at` (30 days before expiry), and `risk_acceptance.expiry_warning` (7 days before expiry). Compensating controls must be documented in the linked `risk.remediation_evidence`. Upon expiry without renewal, the system automatically reverts the associated risk to breach status by creating a `risk_breach` record. Acceptance decisions require CCO approval for Moderate risks and CRO + Board Risk Committee approval for High/Very High risks (approval tier defined in the supporting procedures). Write access is restricted to Risk Management and the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Risk acceptance requested (`risk_acceptance.requested`) | `risk.id`, `risk_acceptance.rationale`, proposed `risk_acceptance.expiry_date`, compensating controls (`risk.remediation_evidence`), requestor identity (`user.id`) | Acceptance record created; decision task assigned to appropriate approver (`risk_acceptance.decision_due_at` set) | Immediate on submission |
| Decision deadline reached (`risk_acceptance.decision_due_at`) | `risk_acceptance.id`, approver identity (`user.id`), decision outcome | Acceptance approved or rejected; outcome recorded (`risk_acceptance.decided`) | 30 calendar days from request (enforced by `risk_acceptance.decision_due_at`) |
| 30-day expiry alert (`risk_acceptance.expiry_alert_at`) | `risk_acceptance.id`, `risk_acceptance.expiry_date`, `risk_acceptance.owner_id` | Alert sent to owner and approver; renewal task created (`risk_acceptance.expiry_alerted`) | 30 days before `risk_acceptance.expiry_date` (enforced by `risk_acceptance.expiry_alert_at`) |
| 7-day expiry alert (`risk_acceptance.expiry_warning`) | `risk_acceptance.id`, `risk_acceptance.expiry_date`, `risk_acceptance.owner_id` | Escalation alert sent to CCO and owner (`risk_acceptance.expiry_alerted`) | 7 days before `risk_acceptance.expiry_date` (enforced by `risk_acceptance.expiry_warning`) |
| Acceptance expires without renewal (`risk_acceptance.expired`) | `risk_acceptance.id`, `risk_acceptance.expiry_date`, linked `risk.id` | Acceptance record closed; breach record automatically created for the associated risk (`risk_breach.opened`) | Immediately at `risk_acceptance.expiry_date` |

**ALERTS/METRICS:** Alert fires for any acceptance decision not made within 30 calendar days (target: zero late decisions). Alert fires for any acceptance that lapses to breach status (target: zero unmanaged lapses). Dashboard shows count of active acceptances by expiry horizon (>30 days, 8–30 days, ≤7 days) and count of lapsed acceptances in the current period.

---

## ERM-08 — Risk Reporting & Governance Oversight {#erm-08-risk-reporting--governance-oversight}

**WHY (Reg cite):** [12 CFR §741.3 and Appendix A to Part 741](https://www.ecfr.gov/current/title-12/part-741) require Board and management oversight of risk; NCUA ERM guidance expects regular, complete, and reconciled risk reporting to the Board and senior management. Accurate, timely reporting is the mechanism by which the three lines of defense and the Board fulfill their oversight responsibilities.

**SYSTEM BEHAVIOR:** The GRC system generates two standard report packages: a management risk report (at least monthly, `risk_report.management_due_at`) and a Board/Board Risk Committee report (at least quarterly, `risk_report.board_due_at`). Each package includes a risk heatmap, top-risks summary, breach and acceptance summaries, KRI trend data, and drill-down capability to underlying records. The system performs an automated reconciliation check before each report is finalized: any figure that conflicts with source data in the risk register, breach log, or acceptance log is flagged in `risk_report.reconciliation_record` and must be explained or corrected before distribution. Incomplete data (e.g., stale KRIs, unscored risks) is caveated in the report with the count and nature of gaps. Reports are write-restricted to Risk Management; the CCO approves before distribution. Board reports are distributed to the Board Risk Committee and full Board of Directors. Internal Audit receives copies of all Board-level reports.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monthly management report due (`risk_report.management_due_at`) | Current risk register snapshot (`risk.register_snapshot`), open breach list (`risk_breach.remediation_status`), active acceptances (`risk_acceptance.expiry_date`), KRI status (`kri.status_evaluated`), reconciliation check (`risk_report.reconciliation_record`) | Management risk report issued; reconciliation record attached; any data gaps caveated (`risk_report.management.issued`) | Monthly (enforced by `risk_report.management_due_at`) |
| Quarterly Board/BRC report due (`risk_report.board_due_at`) | All management report inputs plus Board-level heatmap, top-10 risks, breach trend, acceptance trend, KRI trend charts, drill-down links | Board risk report issued; distributed to Board Risk Committee and Board of Directors; copy to Internal Audit (`risk_report.board.issued`) | Quarterly (enforced by `risk_report.board_due_at`) |
| Reconciliation break detected during report preparation (`risk_report.reconciliation_break.detected`) | Conflicting figures, source records, nature of discrepancy | Break documented in `risk_report.reconciliation_record`; CCO notified; report held until resolved or break is explained with caveat (`risk_report.reconciliation.recorded`) | Before report distribution |

**ALERTS/METRICS:** Alert fires if `risk_report.management_due_at` or `risk_report.board_due_at` is breached without an issued report (target: zero late reports). Alert fires for any unresolved reconciliation break at time of distribution (target: zero unexplained breaks). Dashboard tracks report issuance timeliness and count of caveated data gaps per report cycle.

---

## Governance & Sign-Off {#governance}

**Policy Owner:** Patrick Wilson, Chief Compliance Officer

**Approvers:**
- Patrick Wilson, Chief Compliance Officer

**Review Cadence:** This Framework is reviewed at least annually and within 90 calendar days of any material strategic change, consistent with [ERM-01](#erm-01-enterprise-risk-appetite-statement).

**Three Lines of Defense:**
- **First Line (Business Lines):** Own and manage risks within their operations; maintain risk register entries and control evidence for risks in their domain.
- **Second Line (Risk Management & Compliance):** Maintain this Framework, the risk register, KRI definitions, breach records, and acceptance records; produce all standard reports; challenge first-line risk assessments.
- **Third Line (Internal Audit):** Independently assess the effectiveness of the ERM Framework, including completeness of the risk register, timeliness of escalations, and accuracy of Board reporting; findings reported to the Board Audit Committee and Board Risk Committee.

**Governance Bodies:**
- **Board of Directors:** Approves the Enterprise Risk Appetite Statement; receives quarterly risk reports.
- **Board Risk Committee:** Reviews breach escalations within 30 calendar days for Major/Critical breaches; receives quarterly risk reports.
- **Management Risk Committee:** Reviews breach escalations and acceptance requests; receives monthly risk reports.
- **Internal Audit:** Receives copies of all Board-level risk reports; independently assesses Framework effectiveness.

**Cross-References (out of scope for this Framework; must conform to it):**
- Risk Appetite Statements by risk type (Interest Rate, Liquidity, Credit, Operational/Technology)
- Model Risk Management Program
- Liquidity Policy
- Capitalization and Basel II Standardized Approach Framework Policies
- Third-Party Risk Policy
- Internal Controls and Audit Policies

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The ERM-domain resources, fields, and events referenced throughout this document (`risk_appetite`, `risk_breach`, `risk_acceptance`, `risk_scale`, `taxonomy`, `kri`, `risk_report`, and their associated fields and events) are registered in `core-vocabulary.json` and used verbatim per the registered spelling. No new objects or actions were coined. All timer codes (`risk_appetite.review_due_at`, `risk_appetite.rereview_due_at`, `risk_breach.triage_due_at`, `risk_breach.committee_due_at`, `risk_breach.review_due_at`, `risk_acceptance.decision_due_at`, `risk_acceptance.expiry_alert_at`, `risk_acceptance.expiry_warning`, `risk.reassessment_due_at`, `risk.assessment_due_at`, `kri.staleness_check_at`, `risk_report.management_due_at`, `risk_report.board_due_at`, `risk_scale.review_due_at`, `taxonomy.review_due_at`) are registered in the vocabulary. Engineering should confirm that the `risk_acceptance.expiry_alert_at` and `risk_acceptance.expiry_warning` fields support two distinct alert thresholds (30-day and 7-day) on the same record, or that two separate Task instances are used.

- **CRO role vs. CCO role.** Patrick Wilson holds the CCO title. PATRICK_NOTES reference a CRO for breach triage notification and scale exemptions. This Framework assumes the CCO performs CRO functions at Pynthia Credit Union, or that a CRO role exists or will be designated. If no CRO exists, the Board Risk Committee should be confirmed as the escalation recipient for Major/Critical breach triage. This assumption should be confirmed before the Framework takes effect.

- **Minor and Moderate breach triage windows.** PATRICK_NOTES specify triage and committee timelines only for Major/Critical breaches. This Framework defers the triage windows for Minor and Moderate breaches to supporting procedures. Those procedures must be documented and conform to this Framework before go-live.

- **Risk acceptance approval tiers.** PATRICK_NOTES require a structured approval workflow but do not specify which approval tier (CCO alone vs. CRO + BRC) applies to which risk rating band. This Framework states the principle (higher ratings require higher approval) and defers the specific tier matrix to the supporting procedures. The tier matrix must be documented and approved before the acceptance workflow is activated.

- **GRC system capability.** This Framework assumes a GRC/risk system capable of storing all defined fields and events, enforcing taxonomy validation at save time, automating timer-based tasks, and generating the required reports with drill-down. If the current system cannot enforce taxonomy validation as a blocking save, a compensating manual review control must be documented until the system is upgraded.

- **HMDA reporter status.** Not applicable to this Framework; HMDA applicability is addressed in the Fair Lending Policy.

- **SR 11-7 applicability.** The REFERENCE_POLICY (Model Risk Management Program) references Federal Reserve SR 11-7. Pynthia Credit Union is a federally insured credit union, not a bank. NCUA has not formally adopted SR 11-7, but NCUA examination guidance treats it as a benchmark for model risk management. The Model Risk Management Program (out of scope for this Framework) should confirm the applicable standard. This Framework's ERM controls are grounded in 12 CFR §741.3 and NCUA ERM guidance, which are directly applicable to federally insured credit unions.

- **`risk_acceptance.expiry_alert_at` field supports dual-threshold alerts.** The registered `risk_acceptance` schema shows a single `expiry_alert_at` field and a separate `expiry_warning` field. This Framework uses both fields for the 30-day and 7-day alerts respectively. Engineering should confirm both fields are populated at acceptance creation and that separate Task instances are created for each alert.
