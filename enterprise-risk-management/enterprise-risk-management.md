# Enterprise Risk Management

Pynthia Federal Credit Union (“Pynthia” or the “Credit Union”) manages risk deliberately and transparently across financial, operational, compliance, technology, model, strategic, and reputational risk types. This Framework defines **how** we express risk appetite, rate risks using a consistent 5x5 matrix, escalate and report breaches, and keep a living risk register. It does **not** list specific risks or limits; those live in separate risk appetite statements, registers, and committee charters that must conform to this Framework.

### Multi-Rule Authority Table <a href="#authority" id="authority"></a>

| Topic                                               | Scope                                                                                      | Key Clauses / Notes                                                                                                                                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NCUA Requirements for Insurance – Risk Policies** | Written policies and risk management programs for federally insured credit unions          | [12 CFR §741.3](https://www.law.cornell.edu/cfr/text/12/741.3) and [Appendix A to Part 741](https://www.law.cornell.edu/cfr/text/12/appendix-A_to_part_741) (interest rate risk policy and program expectations)    |
| **NCUA ERM & Risk Appetite Guidance**               | Enterprise risk management, risk appetite, and risk culture expectations for credit unions | NCUA Examiner’s Guide – Enterprise Risk Management & Basic Components of ERM (risk appetite and risk culture); NCUA Enterprise Risk Appetite Statement (used as a structuring benchmark)                            |
| **Model Risk Management Guidance**                  | Model-based risk assessments and use of quantitative tools                                 | Federal Reserve SR 11-7 “Supervisory Guidance on Model Risk Management” (including development, validation, and governance expectations) and parallel OCC/FDIC adoptions                                            |
| **Internal Governance Documents**                   | Implementation-level expectations                                                          | Pynthia Board Charter, Risk Committee Charter, ALCO Charter, Model Risk Management Program, and key risk-type policies (Credit, Liquidity, Operational/Technology, BSA/AML, etc.) that must align to this Framework |

### Timing Matrix <a href="#timing-matrix" id="timing-matrix"></a>

| Scenario                                 | Trigger (human → event)                                                           |                                                                                                                  Deadline | Content Reference                                                                 | Control                                                                                                                                                                                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------: | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Annual Enterprise Risk Assessment        | CRO launches annual ERM cycle → `risk_assessment.cycle_started`                   |                                                     Complete and reported to Board within 90 calendar days of cycle start | Enterprise risk appetite statement; risk register; KRI set                        | [RA-01](enterprise-risk-management.md#ra-01-enterprise-risk-appetite-statement), [RA-04](enterprise-risk-management.md#ra-04-risk-assessment-register-maintenance)                                                                      |
| New Product / Fintech Partner Onboarding | Business owner submits concept / term sheet → `product_risk.assessment_requested` |                                         Pre-launch assessment completed and signed off before first customer is onboarded | Product/partner risk assessment, including financial and operational risk ratings | [RA-02](enterprise-risk-management.md#ra-02-risk-taxonomy-categories), [RA-03](enterprise-risk-management.md#ra-03-risk-scoring-matrix-rating-scale), [RA-04](enterprise-risk-management.md#ra-04-risk-assessment-register-maintenance) |
| Scheduled KRI Monitoring                 | Risk function runs scheduled monitoring job → `kri.monitoring_run`                |                                              KRIs reviewed at least monthly; red KRI breaches escalated same business day | KRI dashboard; threshold settings; breach flags                                   | [RA-05](enterprise-risk-management.md#ra-05-key-risk-indicators-thresholds), [RA-06](enterprise-risk-management.md#ra-06-risk-appetite-breach-escalation-incident-management)                                                           |
| Risk Appetite Breach (Red)               | System flags breach of approved risk appetite limit → `risk_breach.detected`      | Initial triage & notification within 1 business day; remediation plan or risk acceptance decision within 30 calendar days | Breach log; remediation / acceptance documentation                                | [RA-06](enterprise-risk-management.md#ra-06-risk-appetite-breach-escalation-incident-management), [RA-07](enterprise-risk-management.md#ra-07-risk-acceptance-exceptions)                                                               |
| Material Change to Risk Profile          | M\&A, major new program, or regulatory action → `risk_profile.change_identified`  |                                                                          Targeted risk assessment within 30 calendar days | Updated risk register segment; refreshed ratings and KRIs                         | [RA-02](enterprise-risk-management.md#ra-02-risk-taxonomy-categories), [RA-04](enterprise-risk-management.md#ra-04-risk-assessment-register-maintenance)                                                                                |
| Policy & Framework Review                | CRO schedules annual framework review → `policy.review_started`                   |                                                                  Completed at least annually; Board re-approval as needed | This Framework, risk appetite statements, governance roles                        | [RA-01](enterprise-risk-management.md#ra-01-enterprise-risk-appetite-statement), [RA-08](enterprise-risk-management.md#ra-08-risk-reporting-governance-oversight)                                                                       |

### Control Index <a href="#control-index" id="control-index"></a>

| ID                                                                                               | Control Name                                          | Purpose                                                                                                                             | Primary Rule(s)                                                                                                                    |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| [RA-01](enterprise-risk-management.md#ra-01-enterprise-risk-appetite-statement)                  | Enterprise Risk Appetite Statement                    | Define how much risk the Credit Union is willing to accept by risk type and align ERM to strategy.                                  | NCUA ERM & risk appetite guidance; enterprise risk management best practices                                                       |
| [RA-02](enterprise-risk-management.md#ra-02-risk-taxonomy-categories)                            | Risk Taxonomy & Categories                            | Define consistent risk categories covering financial, operational, compliance, technology, model, strategic, and reputational risk. | NCUA ERM Examiner’s Guide; [12 CFR Part 741](https://www.law.cornell.edu/cfr/text/12/part-741) (safety and soundness expectations) |
| [RA-03](enterprise-risk-management.md#ra-03-risk-scoring-matrix-rating-scale)                    | Risk Scoring Matrix & Rating Scale                    | Define the 5x5 likelihood/impact matrix and scoring rules used across the Credit Union.                                             | NCUA risk management guidance; internal Board-approved standards                                                                   |
| [RA-04](enterprise-risk-management.md#ra-04-risk-assessment-register-maintenance)                | Risk Assessment & Register Maintenance                | Ensure all material risks are assessed, rated, owned, and kept current in a centralized register.                                   | NCUA ERM guidance; [12 CFR §741.3](https://www.law.cornell.edu/cfr/text/12/741.3) (written policies and risk programs)             |
| [RA-05](enterprise-risk-management.md#ra-05-key-risk-indicators-thresholds)                      | Key Risk Indicators & Thresholds                      | Set measurable indicators and thresholds that operationalize risk appetite and trigger escalation.                                  | NCUA ERM guidance; internal limits policies (e.g., IRR, liquidity)                                                                 |
| [RA-06](enterprise-risk-management.md#ra-06-risk-appetite-breach-escalation-incident-management) | Risk Appetite Breach Escalation & Incident Management | Define pathways and timelines for escalating, triaging, and resolving appetite breaches.                                            | NCUA safety and soundness expectations; Board and committee charters                                                               |
| [RA-07](enterprise-risk-management.md#ra-07-risk-acceptance-exceptions)                          | Risk Acceptance & Exceptions                          | Govern who may accept or temporarily tolerate risk positions above appetite and how.                                                | NCUA ERM guidance; internal delegation of authority                                                                                |
| [RA-08](enterprise-risk-management.md#ra-08-risk-reporting-governance-oversight)                 | Risk Reporting & Governance Oversight                 | Ensure timely, transparent risk reporting to management and the Board, and alignment with 3-lines-of-defense.                       | NCUA ERM guidance; Board & committee charters; SR 11-7 concepts for model-based risk reporting                                     |

### Control Overlays (Design Overlay v2)

#### RA-01 — Enterprise Risk Appetite Statement <a href="#ra-01-enterprise-risk-appetite-statement" id="ra-01-enterprise-risk-appetite-statement"></a>

* WHY (Reg cite): Align risk-taking with the Credit Union’s mission and strategic plan and set clear boundaries for risk, consistent with NCUA ERM expectations and safety-and-soundness standards (including [12 CFR Part 741](https://www.law.cornell.edu/cfr/text/12/part-741) and related guidance).
* SYSTEM BEHAVIOR:
  * Store a **single authoritative enterprise risk appetite statement** document and structured data (per risk category) in the risk system.
  * Enforce versioning, effective/expiry dates, and approval history (Board, committees).
  * Lock appetite settings from edit except by authorized roles (CRO + delegated risk officers) with electronic approvals.
* TRIGGERS (human → event):
  * CRO drafts or updates appetite → `risk_appetite.draft_created`
  * Risk Committee approves → `risk_appetite.committee_approved`
  * Board approves → `risk_appetite.board_approved`
  * Appetite statement becomes effective → `risk_appetite.effective_started`
* INPUTS (human → field):
  * Risk category (e.g., Credit, Liquidity, Operational/Technology) `(risk_appetite.category)`
  * Appetite level (e.g., Averse / Moderate / Tolerant) `(risk_appetite.level)`
  * Narrative statement `(risk_appetite.statement_text)`
  * Quantitative boundary type (e.g., “NEV % change”, “capital ratio”, “incident count”) `(risk_appetite.boundary_type)`
  * High-level quantitative boundary value or range `(risk_appetite.boundary_value)`
  * Effective date / review date `(risk_appetite.effective_date)`, `(risk_appetite.next_review_date)`
  * Approving body and date `(risk_appetite.approver_body)`, `(risk_appetite.approval_date)`
* OUTPUTS:
  * Machine-readable risk appetite configuration per category.
  * Human-readable PDF / dashboard view for Board and examiners.
  * Downstream configuration objects consumed by limit monitoring, KRI dashboards, and scenario analysis.
* TIMERS/SLAs:
  * Enterprise risk appetite reviewed at least annually and within 90 days of a material strategic change.
  * System flags upcoming review **30 days** before `risk_appetite.next_review_date`.
* EDGE CASES:
  * Overlapping or conflicting appetite statements (e.g., enterprise vs. specific program) must be flagged for CRO resolution.
  * If a new risk category is created without appetite defined, system must label it **“UNDEFINED APPETITE”** and prevent marking residual risk as “within appetite”.
* AUDIT LOGS (event names):
  * `risk_appetite.field_updated` (per field before/after)
  * `risk_appetite.approval_recorded`
  * `risk_appetite.review_completed`
* ACCESS CONTROL:
  * Read: all management, Internal Audit, and Board support staff.
  * Edit: CRO and designated ERM staff only.
  * Approve: Risk Committee / Board via recorded governance process (no direct in-system “approve” by staff without evidence of governance).
* ALERTS/METRICS:
  * Count of risk categories with **defined** vs. **undefined** appetite.
  * % of appetite statements reviewed on time.
  * Automatic alerts to CRO and Corporate Secretary when appetite review is overdue.

#### RA-02 — Risk Taxonomy & Categories <a href="#ra-02-risk-taxonomy-categories" id="ra-02-risk-taxonomy-categories"></a>

* WHY (Reg cite): A clear, enterprise-wide risk taxonomy is a core component of ERM and risk culture; it enables consistent assessment across risk types as expected by NCUA ERM guidance.
* SYSTEM BEHAVIOR:
  * Maintain a canonical list of risk categories and subcategories (financial, operational, compliance, technology, model, strategic, reputational, etc.).
  * Enforce selection from this taxonomy for every risk entry in the risk register, KRI, and incident record.
* TRIGGERS (human → event):
  * CRO or ERM team proposes taxonomy change → `risk_taxonomy.change_proposed`
  * Risk Committee approves taxonomy update → `risk_taxonomy.change_approved`
* INPUTS (human → field):
  * Risk category code `(risk_taxonomy.category_code)`
  * Risk category name `(risk_taxonomy.category_name)`
  * Subcategory code `(risk_taxonomy.subcategory_code)`
  * Subcategory name `(risk_taxonomy.subcategory_name)`
  * Description `(risk_taxonomy.description)`
  * Active / deprecated flag `(risk_taxonomy.status)`
* OUTPUTS:
  * Canonical taxonomy reference table used across systems (GRC, core, vendor risk, model risk).
  * Mapping tables where legacy systems use different category codes.
* TIMERS/SLAs:
  * Taxonomy reviewed at least annually and when adding new product types, business lines, or risk domains.
* EDGE CASES:
  * Legacy records mapped to deprecated categories must retain historical mapping while being reclassified into current taxonomy.
  * System must prevent creation of a risk record with a free-text category not in taxonomy.
* AUDIT LOGS:
  * `risk_taxonomy.category_added`
  * `risk_taxonomy.category_deprecated`
  * `risk_taxonomy.mapping_updated`
* ACCESS CONTROL:
  * Edit: ERM team under CRO.
  * Read: all systems and users that create or review risk-related records.
* ALERTS/METRICS:
  * % of risk records mapped to deprecated categories.
  * Count of categories/subcategories per risk type (to avoid unnecessary proliferation).

#### RA-03 — Risk Scoring Matrix & Rating Scale <a href="#ra-03-risk-scoring-matrix-rating-scale" id="ra-03-risk-scoring-matrix-rating-scale"></a>

* WHY (Reg cite): A consistent scoring methodology is required for meaningful, comparable risk assessment across risk types; aligns with NCUA expectations for effective risk management and internal control frameworks.
* SYSTEM BEHAVIOR:
  * Implement a **5x5 likelihood vs. impact matrix**, with numerical scores and qualitative labels for both axes and overall risk rating (e.g., Very Low, Low, Moderate, High, Very High).
  * Enforce use of this matrix for all enterprise risk assessments (financial, operational, etc.) unless explicitly exempted by CRO.
* TRIGGERS (human → event):
  * ERM team configures or updates scale definitions → `risk_scale.configuration_updated`
  * Risk owner submits or updates a risk assessment → `risk_assessment.submitted`
* INPUTS (human → field):
  * Likelihood score (1–5) `(risk_score.likelihood_raw)`
  * Likelihood description `(risk_score.likelihood_label)`
  * Impact score (1–5) `(risk_score.impact_raw)`
  * Impact description `(risk_score.impact_label)`
  * Computed inherent risk score `(risk_score.inherent_numeric)`
  * Computed inherent rating band `(risk_score.inherent_band)`
  * Computed residual risk score `(risk_score.residual_numeric)`
  * Computed residual rating band `(risk_score.residual_band)`
  * Justification narrative `(risk_score.justification_text)`
* OUTPUTS:
  * Normalized 1–25 risk scores and bands for each risk record.
  * Configurable mapping tables (e.g., 1–4 Very Low, 5–8 Low, 9–12 Moderate, 13–19 High, 20–25 Very High).
* TIMERS/SLAs:
  * Risk scoring scale reviewed at least every three years or when major changes occur in business model or regulatory expectations.
* EDGE CASES:
  * If likelihood/impact inputs are missing, system blocks saving the assessment.
  * If risk is purely qualitative (e.g., emerging risk), system requires default scoring rules approved by ERM.
* AUDIT LOGS:
  * `risk_score.scale_changed`
  * `risk_score.recalculated` (with previous vs. new values)
* ACCESS CONTROL:
  * Scale configuration: ERM only.
  * Risk scoring inputs: risk owners and delegates for their risks; read for others as appropriate.
* ALERTS/METRICS:
  * Distribution of residual risk ratings across categories (heatmap).
  * Count and percentage of risks rated High/Very High inherent vs. residual.

#### RA-04 — Risk Assessment & Register Maintenance <a href="#ra-04-risk-assessment-register-maintenance" id="ra-04-risk-assessment-register-maintenance"></a>

* WHY (Reg cite): NCUA expects credit unions to identify, measure, monitor, and control risk; a central risk register and periodic assessments are foundational to this obligation.
* SYSTEM BEHAVIOR:
  * Maintain a **centralized enterprise risk register** that holds all material risks, their ratings, controls, and owners.
  * Support risk lifecycle states (identified, assessed, mitigated, monitored, closed).
  * Integrate with incident, model risk, vendor risk, and compliance issue tracking to avoid duplicate risk records.
* TRIGGERS (human → event):
  * New risk identified (e.g., by risk owner, audit, regulator) → `risk_record.created`
  * Risk assessment completed / updated → `risk_assessment.completed`
  * Risk closed → `risk_record.closed`
* INPUTS (human → field):
  * Risk ID `(risk_record.id)`
  * Title and description `(risk_record.title)`, `(risk_record.description)`
  * Risk category / subcategory `(risk_record.category_code)`, `(risk_record.subcategory_code)`
  * Inherent and residual scores (from RA-03) `(risk_record.inherent_band)`, `(risk_record.residual_band)`
  * Primary risk owner `(risk_record.owner_id)`
  * Related controls `(risk_record.control_refs)`
  * Related KRIs `(risk_record.kri_refs)`
  * Status `(risk_record.status)` and target date `(risk_record.target_date)`
* OUTPUTS:
  * Current risk register views (by category, owner, severity).
  * Historical snapshots for trending, Board reporting, and exam evidence.
* TIMERS/SLAs:
  * High/Very High residual risks: reassessed at least quarterly.
  * Moderate: at least annually.
  * Low/Very Low: every two years or on trigger events.
* EDGE CASES:
  * Duplicate risk records must be merged with clear history.
  * Risks with no owner or no review within SLA are automatically flagged.
* AUDIT LOGS:
  * `risk_record.reassigned`
  * `risk_record.review_overdue_flagged`
  * `risk_record.lifecycle_changed`
* ACCESS CONTROL:
  * Create/Update: first-line risk owners and designated delegates; ERM can edit meta fields and ensure consistency.
  * Read: at minimum, management, Internal Audit, and relevant committee support staff.
* ALERTS/METRICS:
  * ## and % of risks with overdue reassessments.
  * Top 10 residual risks by score and trend over time.

#### RA-05 — Key Risk Indicators & Thresholds <a href="#ra-05-key-risk-indicators-thresholds" id="ra-05-key-risk-indicators-thresholds"></a>

* WHY (Reg cite): KRIs are a standard tool in ERM to monitor whether actual risk levels remain within appetite and to provide early warning of emerging issues.
* SYSTEM BEHAVIOR:
  * Allow definition of KRIs linked to specific risks and categories, with numeric thresholds aligned to appetite (green/amber/red).
  * Support automated and manual data feeds; compute status vs. thresholds and aggregate for dashboards.
* TRIGGERS (human → event):
  * KRI defined or updated → `kri.definition_updated`
  * KRI data load from source system → `kri.data_ingested`
  * Breach of threshold detected → `kri.breach_detected`
* INPUTS (human → field):
  * KRI ID and name `(kri.id)`, `(kri.name)`
  * Linked risk record `(kri.risk_id)`
  * Measurement definition (formula, source system) `(kri.definition_text)`
  * Frequency (daily/weekly/monthly/quarterly) `(kri.frequency)`
  * Green/amber/red thresholds `(kri.threshold_green)`, `(kri.threshold_amber)`, `(kri.threshold_red)`
  * Direction of risk (higher-is-worse or lower-is-worse) `(kri.direction)`
  * Owner `(kri.owner_id)`
* OUTPUTS:
  * KRI dashboards and trend charts by category and owner.
  * Breach logs feeding escalation (RA-06).
* TIMERS/SLAs:
  * KRIs refreshed at configured frequency; system flags stale data if no update received within 1.5x expected interval.
* EDGE CASES:
  * KRIs with incomplete thresholds or missing direction must not be marked “Active”.
  * Manual overrides of KRI values must be documented and auditable.
* AUDIT LOGS:
  * `kri.value_overridden`
  * `kri.threshold_changed`
  * `kri.breach_status_changed`
* ACCESS CONTROL:
  * Configure thresholds: ERM + risk owners for their KRIs.
  * Read-only dashboards: managers, committees, Internal Audit, Board support.
* ALERTS/METRICS:
  * Count of red and amber KRIs by category.
  * % of KRIs with stale data.
  * Time from breach detection to initial triage.

#### RA-06 — Risk Appetite Breach Escalation & Incident Management <a href="#ra-06-risk-appetite-breach-escalation-incident-management" id="ra-06-risk-appetite-breach-escalation-incident-management"></a>

* WHY (Reg cite): Safety-and-soundness expectations require timely identification, escalation, and remediation of risk positions outside appetite; effective escalation pathways are essential to Board oversight and supervisory confidence.
* SYSTEM BEHAVIOR:
  * Detect when risk assessments, KRIs, or quantitative limits indicate a position is **outside** approved appetite.
  * Automatically generate a **breach record** with severity, initial triage, and escalation workflow.
  * Track remediation activities until risk is back within appetite or formally accepted (RA-07).
* TRIGGERS (human → event):
  * Automatic breach detection (e.g., KRI crosses red threshold) → `risk_breach.detected`
  * Manual breach declaration by risk owner / ERM → `risk_breach.manually_logged`
  * Escalation to management / committee → `risk_breach.escalated`
  * Breach closed → `risk_breach.closed`
* INPUTS (human → field):
  * Linked risk record or limit `(risk_breach.risk_id)`
  * Source (KRI, limit, incident, exam finding) `(risk_breach.source_type)`
  * Breach severity (Minor / Moderate / Major / Critical) `(risk_breach.severity)`
  * Initial impact assessment `(risk_breach.impact_summary)`
  * Required escalation path `(risk_breach.escalation_path)`
  * Owner and accountable executive `(risk_breach.owner_id)`, `(risk_breach.accountable_executive_id)`
  * Remediation plan summary and target date `(risk_breach.plan_summary)`, `(risk_breach.target_date)`
* OUTPUTS:
  * Breach log, with status and remediation tracking.
  * Escalation notifications and committee packs.
* TIMERS/SLAs:
  * Initial triage and notification to CRO within **1 business day** for Major/Critical breaches.
  * Presentation to appropriate committee (e.g., Risk Committee, ALCO) within **30 calendar days** for Major/Critical breaches.
  * Breach status reviewed at least monthly until closure.
* EDGE CASES:
  * Multiple related breaches (e.g., repeated KRIs) may be linked to a single “master breach” to avoid noise while maintaining paper trail.
  * If a breach cannot be remediated within target date, RA-07 risk acceptance workflow must be triggered.
* AUDIT LOGS:
  * `risk_breach.status_changed`
  * `risk_breach.escalation_step_recorded`
  * `risk_breach.remediation_updated`
* ACCESS CONTROL:
  * Create: first-line risk owners, ERM, Internal Audit (for observed breaches).
  * Modify: ERM and accountable executive; closure requires ERM sign-off.
  * Read: relevant management and Board committees.
* ALERTS/METRICS:
  * ## of open breaches by severity and age.
  * Breaches per quarter by category.
  * Average time-to-triage and time-to-close.

#### RA-07 — Risk Acceptance & Exceptions <a href="#ra-07-risk-acceptance-exceptions" id="ra-07-risk-acceptance-exceptions"></a>

* WHY (Reg cite): Some risk positions may remain outside appetite for a period when remediation is not immediately feasible. Formal risk acceptance ensures transparency, documented rationale, and Board-aligned governance.
* SYSTEM BEHAVIOR:
  * Provide structured **risk acceptance** workflow tied to specific risks and breaches.
  * Record approver, rationale, conditions, and expiry date; track renewal and revocation.
* TRIGGERS (human → event):
  * Risk owner requests acceptance → `risk_acceptance.requested`
  * CRO or committee approves or rejects → `risk_acceptance.decision_recorded`
  * Acceptance expires or is revoked → `risk_acceptance.expired`
* INPUTS (human → field):
  * Linked risk / breach IDs `(risk_acceptance.risk_id)`, `(risk_acceptance.breach_id)`
  * Requested acceptance period `(risk_acceptance.start_date)`, `(risk_acceptance.end_date)`
  * Rationale `(risk_acceptance.justification)`
  * Compensating controls `(risk_acceptance.comp_controls)`
  * Approver role and identity `(risk_acceptance.approver_role)`, `(risk_acceptance.approver_id)`
  * Conditions for renewal `(risk_acceptance.renewal_conditions)`
* OUTPUTS:
  * Register of active risk acceptances and exceptions.
  * Evidence pack for examiners showing governance and time-bounded nature.
* TIMERS/SLAs:
  * Risk acceptance requests decided within 30 calendar days of submission.
  * System issues alerts 30 and 7 days before acceptance expiry.
* EDGE CASES:
  * No “indefinite” acceptances: system must require explicit end date; renewals create a new record referencing prior acceptance.
  * If acceptance expires without renewal, risk must revert to “breach” status until within appetite.
* AUDIT LOGS:
  * `risk_acceptance.approved`
  * `risk_acceptance.rejected`
  * `risk_acceptance.renewed`
* ACCESS CONTROL:
  * Request: first-line risk owners and accountable executives.
  * Approve: only roles defined in delegation of authority (e.g., CRO for Moderate; Risk Committee/Board for High/Very High).
  * Read: ERM, Internal Audit, relevant committees.
* ALERTS/METRICS:
  * Count of active acceptances by severity and category.
  * % of acceptances renewed vs. remediated.
  * Acceptances that lapsed without timely review.

#### RA-08 — Risk Reporting & Governance Oversight <a href="#ra-08-risk-reporting-governance-oversight" id="ra-08-risk-reporting-governance-oversight"></a>

* WHY (Reg cite): Effective governance requires reliable, concise risk reporting to management and the Board, including aggregate views and trends, consistent with NCUA ERM guidance and Board responsibilities for safety and soundness.
* SYSTEM BEHAVIOR:
  * Generate standard risk reports and dashboards for management committees and the Board (e.g., heatmaps, top risks, breach summaries, KRI trends).
  * Support drill-down from aggregate views to underlying risk assessments, breaches, and acceptances.
* TRIGGERS (human → event):
  * Scheduled committee reporting cycles → `risk_report.cycle_started`
  * Ad-hoc Board or regulator request → `risk_report.ad_hoc_requested`
* INPUTS (human → field):
  * Report type (Management / Risk Committee / Board / Regulator) `(risk_report.type)`
  * Reporting period `(risk_report.period_start)`, `(risk_report.period_end)`
  * Included sections (e.g., top risks, appetite breaches, key acceptances) `(risk_report.sections)`
  * Material issues flagged for Board attention `(risk_report.material_items)`
* OUTPUTS:
  * Standardized management and Board packs (PDF/PowerPoint or equivalent) with consistent structure.
  * Data exports for regulatory examinations and Internal Audit.
* TIMERS/SLAs:
  * Management risk reports at least monthly.
  * Board / Board Risk Committee risk reports at least quarterly.
  * Ad-hoc reports within timelines set by Board or regulators.
* EDGE CASES:
  * Conflicting numbers between systems (e.g., ALM vs. risk register) must be reconciled or explicitly explained in the report.
  * If data is incomplete, report must contain visible caveats rather than silently omitting segments.
* AUDIT LOGS:
  * `risk_report.generated` (with parameters)
  * `risk_report.distributed`
  * `risk_report.corrected`
* ACCESS CONTROL:
  * Generate & configure: ERM and CRO delegates.
  * Read: audiences as defined by report type; Board-facing packs controlled by Corporate Secretary.
* ALERTS/METRICS:
  * Report delivery timeliness against committee calendars.
  * Number of material issues requiring Board attention per period.
  * Completion of Board-directed follow-ups.

### Embedded Checklists & Templates <a href="#checklists" id="checklists"></a>

The following checklists and templates will be maintained as **separate artifacts** that must conform to this Framework:

* Enterprise Risk Appetite Statement Pack
  * Template for category-by-category appetite statements, including qualitative text and quantitative boundaries.
  * Board approval cover sheet.
* Risk Assessment Template
  * Standard form for documenting each risk (fields aligned with RA-02, RA-03, RA-04), including inherent/residual scoring, controls, and owner.
* Risk Register Data Dictionary
  * Canonical field definitions, allowable values, and ownership for every `risk_record.*` and `risk_score.*` field used in this Framework.
* KRI Definition & Onboarding Checklist
  * Steps to design, validate, and approve a new KRI (data source validation, thresholds, owner confirmation, test run).
* Breach Escalation Playbook
  * Step-by-step guide for triaging breaches, assigning owners, engaging Legal/Compliance, and preparing committee updates, aligned to RA-06.
* Risk Acceptance Memo Template
  * Standardized structure for RA-07 requests, including risk description, rationale, compensating controls, and proposed duration.
* Board & Committee Reporting Templates
  * Standard slide and dashboard layouts for RA-08, including risk heatmaps, trends, and breach/acceptance summaries.

### Governance & Sign-Off <a href="#governance" id="governance"></a>

* Ownership: The Chief Risk Officer owns this Framework, ensures alignment with the Enterprise Risk Management Program, and is responsible for implementation across all business units and risk types.
* Approvals:
  * Management Risk Committee reviews and recommends this Framework.
  * Board Risk Committee (or equivalent) endorses and recommends approval.
  * Board of Directors approves the Framework and any material changes.
* Review Cadence:
  * This Framework is reviewed at least annually and upon material changes to Pynthia’s strategy, risk profile, or regulatory expectations.
  * Changes are tracked via version control with a brief change log.
* Three Lines of Defense Alignment:
  * First Line: Business units own risks, perform assessments, and execute controls (RA-04, RA-05, RA-06, RA-07).
  * Second Line (Risk & Compliance): Designs and operates this Framework, challenges assessments, and runs reporting (RA-01 through RA-08).
  * Third Line (Internal Audit): Independently assesses design and effectiveness of this Framework and its operation.
* Cross-References:
  * Model Risk Management Program (for SR 11-7 alignment and model-specific controls).
  * Credit, Liquidity/ALM, Operational/Technology, Information Security, BSA/AML, and Vendor Management policies, each of which must use the taxonomy, scoring, and escalation mechanics defined here.

### Assumptions & Gaps

* Organization & Policy Name: Assumes this Framework is being adopted by Pynthia Federal Credit Union as an enterprise-level risk appetite and assessment framework; if a different entity or narrower scope is intended (e.g., model risk only), the scope and titles should be adjusted.
* Regulatory Scope: Assumes U.S. federal regulation applies and that NCUA ERM guidance and [12 CFR Part 741](https://www.law.cornell.edu/cfr/text/12/part-741) are the primary authorities; state or corporate CU rules may impose additional requirements.
* Risk Types: Assumes the Credit Union will separately document detailed risk appetite statements by risk type (e.g., Interest Rate Risk, Liquidity, Credit, Operational/Technology) consistent with RA-01; those statements are **not** included here.
* Systems: Assumes the existence or planned procurement of a GRC/risk system capable of storing the fields and events described; if not available, some behaviors will need manual or spreadsheet-based interim controls.
