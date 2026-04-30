# Lending

### GENERAL POLICY STATEMENT

Pynthia Federal Credit Union (“Pynthia”) will extend credit only on a safe-and-sound, non-discriminatory basis across all channels and partner programs. All acceptance and denial decisions must be based on neutral creditworthiness factors, consistent with the Equal Credit Opportunity Act (ECOA/Reg B), Fair Housing Act, TILA/Reg Z (including ATR/QM), HMDA/Reg C, FCRA, NCUA rules, and this policy. Steering, discriminatory product placement, and insider loans to employees are prohibited. This policy is also a design spec for Pynthia’s lending systems and BaaS integrations.

***

### MULTI-RULE AUTHORITY TABLE <a href="#authority" id="authority"></a>

| Topic                                    | Scope                                                  | Key Clauses / Notes                                                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Prohibited basis discrimination          | All credit products/channels                           | ECOA/Reg B 12 CFR Part 1002 (esp. §§1002.4, 1002.5–6, 1002.9, 1002.12–14): `https://www.ecfr.gov/current/title-12/part-1002`                                       |
| Real estate fair lending & redlining     | Dwelling-secured credit                                | Fair Housing Act 42 USC §3605: `https://www.law.cornell.edu/uscode/text/42/3605`; NCUA 701.31: `https://www.ecfr.gov/current/title-12/part-701/section-701.31`     |
| Action-taken notices & AA timing         | All covered credit decisions                           | ECOA/Reg B §1002.9 (action taken): `https://www.ecfr.gov/current/title-12/part-1002#p-1002.9`; FCRA §615(a) AA: `https://www.law.cornell.edu/uscode/text/15/1681m` |
| Appraisals & valuation delivery          | First-lien dwelling-secured credit                     | ECOA/Reg B §1002.14 (appraisals): `https://www.ecfr.gov/current/title-12/part-1002#p-1002.14`                                                                      |
| Government Monitoring Information / HMDA | Certain dwelling-secured credit                        | Reg B §1002.13 (GMI); Reg C/HMDA 12 CFR Part 1003: `https://www.ecfr.gov/current/title-12/part-1003`                                                               |
| ATR/QM                                   | Closed-end 1–4 family dwelling-secured consumer credit | TILA/Reg Z 12 CFR §1026.43 (ATR/QM): `https://www.ecfr.gov/current/title-12/part-1026#p-1026.43`                                                                   |
| Advertising, HPML & LO steering          | Mortgage & open-end credit                             | Reg Z §§1026.24, 1026.35 (HPML), 1026.36(d),(e) (LO comp/steering): `https://www.ecfr.gov/current/title-12/part-1026`                                              |
| Record retention                         | Apps, evaluations, AA, GMI                             | Reg B §1002.12; Reg C §1003.5; FCRA recordkeeping expectations                                                                                                     |
| OFAC / sanctions                         | All members/obligors                                   | BSA/OFAC – 31 CFR Chapter V; FFIEC BSA/AML Manual (guidance)                                                                                                       |
| NCUA safety & soundness                  | Lending & insider practices                            | NCUA Parts 701, 741, 748 (safety & soundness, reporting, security)                                                                                                 |

***

### TIMING MATRIX <a href="#timing-matrix" id="timing-matrix"></a>

| Scenario                                  | Trigger (human → event)                                              |                                                           Deadline | Content Reference                     | Control                                                           |
| ----------------------------------------- | -------------------------------------------------------------------- | -----------------------------------------------------------------: | ------------------------------------- | ----------------------------------------------------------------- |
| Completed app decision                    | Application deemed complete → `application.completed`                |                                                     30 days (ECOA) | ECOA/Reg B §1002.9                    | [FL-07](lending.md#fl-07-adverse-action-notifications)            |
| Incomplete app – AA                       | Lender decides to deny incomplete app → `decision.denied.incomplete` |                                                     30 days (ECOA) | ECOA/Reg B §1002.9(c)                 | [FL-07](lending.md#fl-07-adverse-action-notifications)            |
| Incomplete app – notice of incompleteness | Lender requests missing info → `notice.incomplete.sent`              |                               “Reasonable” period stated in notice | ECOA/Reg B §1002.9(c)                 | [FL-07](lending.md#fl-07-adverse-action-notifications)            |
| Existing account AA                       | Adverse action on existing account → `account.adverse_action`        |                                                     30 days (ECOA) | ECOA/Reg B §1002.9(a)(3)              | [FL-07](lending.md#fl-07-adverse-action-notifications)            |
| Counteroffer not accepted                 | Counteroffer made → `decision.counteroffer.made`                     |                                 90 days to send AA if not accepted | ECOA/Reg B §1002.9(a)(1)(iv)          | [FL-07](lending.md#fl-07-adverse-action-notifications)            |
| Appraisal/valuation copy                  | Appraisal/valuation completed → `valuation.completed`                | Promptly upon completion and before closing (or promptly after AA) | Reg B §1002.14(a)                     | [FL-06](lending.md#fl-06-appraisals-valuations-collateral)        |
| AA notice mailing                         | AA decision finalized → `decision.denied.final`                      |                               Within applicable ECOA/FCRA deadline | ECOA §1002.9; FCRA §615(a)            | [FL-07](lending.md#fl-07-adverse-action-notifications)            |
| Record retention                          | App or AA notice created → `record.created`                          |                                              ≥25 months (baseline) | Reg B §1002.12                        | [FL-09](lending.md#fl-09-documentation-recordkeeping-retention)   |
| Non-accrual move                          | Loan hits 90+ DPD → `loan.delinquency.90_plus`                       |                          At or shortly after 90 DPD (configurable) | REF\_1 non-accrual rules              | [FL-01](lending.md#fl-01-governance-roles-program-scope)          |
| Charge-off (unsecured)                    | Unsecured loan 90+ DPD → `loan.unsecured.90_plus`                    |                             Charge-off by month-end (configurable) | REF\_1 collections rules              | [FL-01](lending.md#fl-01-governance-roles-program-scope)          |
| Rate sheet refresh                        | New APOR data published → `apor.weekly_update`                       |                                           Weekly (operational SLA) | REF\_3 pricing                        | [FL-10](lending.md#fl-10-pricing-rate-sheets-hpml)                |
| Fair lending risk assessment              | FL assessment cycle start → `flra.cycle_start`                       |                  At least annually (Assumption—needs confirmation) | Patrick: Fair Lending risk assessment | [FL-13](lending.md#fl-13-fair-lending-risk-assessment-monitoring) |

***

### CONTROL INDEX <a href="#control-index" id="control-index"></a>

| ID                                                                     | Control Name                                    | Purpose                                                                                     | Primary Rule(s)                          |
| ---------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------- |
| [FL-01](lending.md#fl-01-governance-roles-program-scope)               | Governance, Roles & Program Scope               | Define ownership, roles, and oversight for lending & fair lending, including BaaS/partners. | ECOA/Reg B §1002.4; NCUA 701.31          |
| [FL-02](lending.md#fl-02-product-eligibility-prohibited-practices)     | Product Eligibility & Prohibited Practices      | Define eligible products and ban high-risk / abusive or discriminatory products.            | Reg Z; FHA; NCUA safety & soundness      |
| [FL-03](lending.md#fl-03-applications-acceptance-denial-standards)     | Applications, Acceptance & Denial Standards     | Standardize intake, acceptance/denial criteria, and neutral-factor underwriting bundle.     | Reg B §§1002.4–6; 1002.13                |
| [FL-04](lending.md#fl-04-credit-scoring-adverse-credit-history)        | Credit Scoring & Adverse Credit History         | Govern use of scores, derogatory history, and alternative credit data.                      | ECOA/Reg B; FCRA; REF\_1/REF\_3 rules    |
| [FL-05](lending.md#fl-05-atr-qm-mortgage-underwriting)                 | ATR/QM & Mortgage Underwriting                  | Implement ATR 8 factors, QM classification, and DTI/ratio rules.                            | Reg Z §1026.43                           |
| [FL-06](lending.md#fl-06-appraisals-valuations-collateral)             | Appraisals, Valuations & Collateral             | Manage valuations, appraisal delivery, and LTV rules.                                       | Reg B §1002.14; Reg Z; FHA/NCUA 701.31   |
| [FL-07](lending.md#fl-07-adverse-action-notifications)                 | Adverse Action & Notifications                  | Govern denials, AA notices, timelines, and secondary review.                                | Reg B §1002.9; FCRA §615(a)              |
| [FL-08](lending.md#fl-08-exceptions-mitigants-overrides)               | Exceptions, Mitigating Factors & Overrides      | Define how exceptions are detected, approved, logged, and monitored.                        | ECOA/Reg B; internal risk mgmt           |
| [FL-09](lending.md#fl-09-documentation-recordkeeping-retention)        | Documentation, Recordkeeping & Retention        | Standardize what must be in the file/system and how long it’s retained.                     | Reg B §1002.12; Reg C; FCRA              |
| [FL-10](lending.md#fl-10-pricing-rate-sheets-hpml)                     | Pricing, Rate Sheets & HPML Controls            | Govern rate sheets, HPML tests, and pricing exceptions.                                     | Reg Z §§1026.35–36                       |
| [FL-11](lending.md#fl-11-ofac-sanctions-gate)                          | OFAC & Sanctions Gate                           | Embed OFAC/sanctions screening into the lending flow.                                       | BSA/OFAC; FFIEC BSA/AML guidance         |
| [FL-12](lending.md#fl-12-prequalification-marketing-steering-controls) | Prequalification, Marketing & Steering Controls | Prevent steering; control prequal and product placement.                                    | Reg B; Reg Z §1026.36(e); FHA            |
| [FL-13](lending.md#fl-13-fair-lending-risk-assessment-monitoring)      | Fair Lending Risk Assessment & Monitoring       | Run ongoing fair lending risk assessments and analytics.                                    | ECOA/FHA; NCUA FL guidance               |
| [FL-14](lending.md#fl-14-insider-lending-employee-conflicts)           | Insider Lending & Employee Conflicts            | Implement “no insider loans to employees” posture and conflicts controls.                   | NCUA safety & soundness; internal policy |

***

### CONTROL OVERLAYS (Design Overlay v2)

#### FL-01 — Governance, Roles & Program Scope <a href="#fl-01-governance-roles-program-scope" id="fl-01-governance-roles-program-scope"></a>

* WHY (Reg cite): ECOA/Reg B §1002.4 (general rule); NCUA 701.31 (nondiscrimination); safety & soundness expectations.
* SYSTEM BEHAVIOR:
  * Represent governance in the system: map each lending/fair-lending control to an owner (e.g., CLO, Compliance, Fair Lending Officer).
  * Tag every product/program (including partner/BaaS programs) with scope flags for this policy.
  * Enforce that only users with appropriate roles can change credit parameters, pricing matrices, or exception thresholds.
* TRIGGERS (human → event):
  * Policy approved/updated → `policy.lending_fl.updated`
  * New product/program onboarded → `product.program.onboarded`
  * Governance role change → `user.role.changed`
* INPUTS (human → field):
  * Program type (direct / fintech-partner / white-label) `(program.type)`
  * Product attributes (secured/unsecured, dwelling-secured, ATR/QM-covered) `(product.attributes)`
  * Control owner role `(control.owner_role)`
* OUTPUTS:
  * Registry of controls → products/programs mapping.
  * Governance dashboard showing owners, next review dates, and open issues.
* TIMERS/SLAs:
  * Policy review at least annually. `(Assumption—needs confirmation)`
  * Governance mapping updated within 30 days of new product/program approval.
* EDGE CASES:
  * BaaS partners with their own policies: system must store and link partner policies and note where Pynthia’s controls are stricter.
* AUDIT LOGS:
  * `policy.change.logged`
  * `program.scope.tagged`
  * `control.owner.assigned`
* ACCESS CONTROL:
  * Only Compliance/Fair Lending and Executive roles may edit control definitions.
* ALERTS/METRICS:
  * Alert when next\_review date is within 30 days and no update in progress.
  * Metric: % of active products/programs mapped to all required FL controls.

***

#### FL-02 — Product Eligibility & Prohibited Practices <a href="#fl-02-product-eligibility-prohibited-practices" id="fl-02-product-eligibility-prohibited-practices"></a>

* WHY (Reg cite): Reg Z (HPML, abusive products), ECOA/Reg B, FHA, NCUA safety & soundness; Patrick: steering procedures, risk posture.
* SYSTEM BEHAVIOR:
  * Maintain a machine-readable “credit box” per product, including allowed collateral, LTV, terms, and prohibited product flags.
  * Block creation of applications for explicitly prohibited products (e.g., payday, vehicle-title, tax RALs, private education loans as defined in Reg Z, stated-income/no-doc).
* TRIGGERS:
  * Product configured/edited → `product.config.updated`
  * Application started → `application.created`
* INPUTS:
  * Product type `(product.type)`
  * Prohibited product flag `(product.prohibited_flag)`
  * LTV/term/FICO ranges `(product.credit_box)`
* OUTPUTS:
  * Validation errors when app/product request is outside permitted product set.
* TIMERS/SLAs:
  * Credit-box review at least annually, and when regs change or risk appetite changes.
* EDGE CASES:
  * Legacy or legacy-partner products with borderline features: mark as `legacy` and require CLO/Compliance approval to keep active.
* AUDIT LOGS:
  * `product.eligibility.changed`
  * `application.blocked.prohibited_product`
* ACCESS CONTROL:
  * Only CLO and Compliance can modify product-level eligibility rules.
* ALERTS/METRICS:
  * Metric: count of attempted originations of prohibited products (should be zero).

***

#### FL-03 — Applications, Acceptance & Denial Standards <a href="#fl-03-applications-acceptance-denial-standards" id="fl-03-applications-acceptance-denial-standards"></a>

* WHY (Reg cite): Reg B §§1002.4–6, 1002.9, 1002.13 (apps, evaluation, GMI); Patrick: “ACCEPTANCE AND DENIAL OF LOAN APPLICATIONS”.
* SYSTEM BEHAVIOR:
  * Enforce a standardized underwriting bundle: application data, credit history, income/assets, debt analysis, DTI, collateral/LTV, OFAC, ATR/QM (where applicable) summarized into a CAR-equivalent object.
  * Require that acceptance and denial decisions are based on neutral factors only; prohibited bases and location proxies are never used.
* TRIGGERS:
  * App initiated → `application.created`
  * App deemed complete → `application.completed`
  * Underwriting started → `underwriting.started`
  * Decision recorded → `decision.approved` / `decision.denied` / `decision.counteroffer`
* INPUTS:
  * App type `(application.type)`
  * Purpose `(application.purpose)`
  * Neutral factors (income, DTI, LTV, credit history) `(application.neutral_factors)`
  * GMI where required `(application.gmi)`
* OUTPUTS:
  * CAR-equivalent summary `(credit_package.car_id)`
  * Decision outcome + timestamp `(decision.outcome, decision.date)`
* TIMERS/SLAs:
  * Decision for completed apps within 30 days (ECOA).
  * Operational SLA: decision generally within 48 hours of complete underwriting package. `(candidate — from REF_3)`
* EDGE CASES:
  * Incomplete applications: system must support either AA denial or incompleteness notice with deadline.
* AUDIT LOGS:
  * `application.logged`
  * `underwriting.bundle.completed`
  * `decision.finalized`
* ACCESS CONTROL:
  * Only authorized underwriters/systems may set decision outcome.
* ALERTS/METRICS:
  * Metric: % of apps decided within regulatory/operational timelines.
  * Fair-lending dashboards: compare acceptance/denial patterns by prohibited-basis proxies using only neutral-factor models.

***

#### FL-04 — Credit Scoring & Adverse Credit History <a href="#fl-04-credit-scoring-adverse-credit-history" id="fl-04-credit-scoring-adverse-credit-history"></a>

* WHY (Reg cite): ECOA/Reg B (fair evaluation), FCRA (credit reports, adverse action), Patrick’s emphasis on fair lending risk.
* SYSTEM BEHAVIOR:
  * Use empirically derived credit scores as a second check, not sole decision driver.
  * Implement configurable FICO bands (e.g., unsecured ≥725, secured ≥660 – candidate values) with exception routing for lower scores or severe derogatories.
  * Capture derogatory-credit tolerances: BK seasoning (e.g., ≥4 years), small medical judgments ≤$1,000 with explanation, etc.
* TRIGGERS:
  * Credit pull → `credit.report.pulled`
  * Credit report refreshed → `credit.report.refreshed`
* INPUTS:
  * FICO scores `(credit.fico_score)`
  * Derogatories (BK, judgments, lates) `(credit.derogatories)`
  * Report age `(credit.report_age_days)`
* OUTPUTS:
  * Score band classification `(credit.score_band)`
  * Adverse-history flags `(credit.adverse_flags)`
* TIMERS/SLAs:
  * Report must be ≤ 6 months old at decision time. _(preferred from dossier)_
* EDGE CASES:
  * Thin/no-file borrowers: system must support alternative credit methods (e.g., landlord/utility references) instead of auto-denial.
* AUDIT LOGS:
  * `credit.report.pulled`
  * `credit.policy.override`
* ACCESS CONTROL:
  * Only designated users/services may pull or view full reports.
* ALERTS/METRICS:
  * Metric: % of denials driven primarily by credit score; review for disparate impact.

***

#### FL-05 — ATR/QM & Mortgage Underwriting <a href="#fl-05-atr-qm-mortgage-underwriting" id="fl-05-atr-qm-mortgage-underwriting"></a>

* WHY (Reg cite): Reg Z §1026.43 (ATR/QM).
* SYSTEM BEHAVIOR:
  * For covered closed-end 1–4 family dwelling-secured loans, require ATR 8-factor checklist completion and QM classification (QM, Small Creditor QM, Balloon QM, Non-QM, Exempt).
  * Implement DTI guideline of 43% for consumer loans as default; maintain ability to configure stricter tiers (e.g., 35% mortgage DTI or lower product-specific DTIs). _(conflict between 35% and 43% — keep both as configurable; Assumption—needs confirmation)_
* TRIGGERS:
  * Loan identified as ATR-covered → `atr.scope.determined`
  * Underwriting completed → `underwriting.completed`
* INPUTS:
  * Monthly income `(atr.monthly_income)`
  * Monthly debts `(atr.monthly_debts)`
  * Housing expenses `(atr.housing_expenses)`
  * DTI `(atr.dti_ratio)`
  * QM type `(atr.qm_type)`
* OUTPUTS:
  * ATR checklist record `(atr.checklist_id)`
  * QM classification stored with loan `(atr.qm_classification)`
* TIMERS/SLAs:
  * ATR checklist must be completed before docs printed.
* EDGE CASES:
  * High-DTI approvals allowed only as exceptions with mitigants and senior approval.
* AUDIT LOGS:
  * `atr.checklist.completed`
  * `qm.type.assigned`
* ACCESS CONTROL:
  * ATR/QM parameters modifiable only by CLO/Compliance.
* ALERTS/METRICS:
  * Metric: distribution of DTIs and QM types; monitor share of Non-QM / exception loans.

***

#### FL-06 — Appraisals, Valuations & Collateral <a href="#fl-06-appraisals-valuations-collateral" id="fl-06-appraisals-valuations-collateral"></a>

* WHY (Reg cite): Reg B §1002.14 (appraisals), FHA, NCUA 701.31; safety & soundness; dossier appraisal rules.
* SYSTEM BEHAVIOR:
  * Enforce independence of appraisals/valuations and maintain an approved appraiser list.
  * For first-lien dwellings: automatically generate appraisal-right disclosure and send free copy promptly on completion, retaining for ≥25 months.
  * Implement product LTV matrices (e.g., autos ≤90% NADA, HELOC/term RE up to 85% LTV with exceptions to 89.9%, lot loans 75% LTV, etc. – all configurable; candidate values).
* TRIGGERS:
  * Valuation ordered → `valuation.ordered`
  * Valuation completed → `valuation.completed`
  * Appraisal copy sent → `valuation.copy.sent`
* INPUTS:
  * Collateral type `(collateral.type)`
  * Appraised value `(collateral.value_appraised)`
  * Exposure `(loan.amount)`
  * LTV `(collateral.ltv)`
* OUTPUTS:
  * Appraisal/valuation record with delivery flag.
  * LTV and collateral sufficiency flags.
* TIMERS/SLAs:
  * Appraisal copy sent promptly after completion and before closing (or promptly after AA).
  * OREO appraisals (if applicable) within 30 days of transfer. _(legacy/candidate)_
* EDGE CASES:
  * Reuse of prior appraisals when <18 months and no material change; mark as exception and document rationale.
* AUDIT LOGS:
  * `valuation.completed`
  * `valuation.copy.sent`
  * `collateral.ltv.override`
* ACCESS CONTROL:
  * Only designated staff/roles may order/assign appraisals.
* ALERTS/METRICS:
  * Metric: % of loans with timely appraisal delivery; % of LTV-over-limit exceptions.

***

#### FL-07 — Adverse Action & Notifications <a href="#fl-07-adverse-action-notifications" id="fl-07-adverse-action-notifications"></a>

* WHY (Reg cite): Reg B §1002.9; FCRA §615(a); Patrick: “ACCEPTANCE AND DENIAL OF LOAN APPLICATIONS”.
* SYSTEM BEHAVIOR:
  * For any denial or counteroffer, enforce ECOA/Reg B and FCRA AA notice content and timing.
  * Require a second-level review of all denials to check for consistency, alternatives, and potential fair lending concerns.
* TRIGGERS:
  * Denial proposed → `decision.denied.proposed`
  * Counteroffer made → `decision.counteroffer.made`
  * AA notice generated → `adverse_action.notice_generated`
  * AA notice sent → `adverse_action.notice_sent`
* INPUTS:
  * AA reasons `(aa.reasons_selected)`
  * Credit bureau info `(aa.bureau_info)`
  * Credit score and factors if used `(aa.score_disclosure)`
* OUTPUTS:
  * AA notice PDF/email.
  * AA log with reasons, dates, and reviewer.
* TIMERS/SLAs:
  * 30 days from completed application decision.
  * 30 days for existing-account AA.
  * 90 days post-counteroffer if not accepted.
* EDGE CASES:
  * Incomplete apps: support ECOA-compliant incompleteness notice path.
* AUDIT LOGS:
  * `aa.secondary_review.completed`
  * `adverse_action.notice_sent`
* ACCESS CONTROL:
  * Only underwriters/Loan Ops may finalize AA notices; Compliance has read access.
* ALERTS/METRICS:
  * Metric: timeliness of AA notices; distribution of AA reasons across segments.

***

#### FL-08 — Exceptions, Mitigating Factors & Overrides <a href="#fl-08-exceptions-mitigants-overrides" id="fl-08-exceptions-mitigants-overrides"></a>

* WHY (Reg cite): ECOA/Reg B fairness; safety & soundness; dossier exception and mitigant catalog.
* SYSTEM BEHAVIOR:
  * Automatically detect breaches of numeric/qualitative policy rules (DTI, FICO, LTV, BK seasoning, product restrictions, etc.).
  * Require exception records with standardized mitigating-factor selection, narrative, and approval routing.
* TRIGGERS:
  * Policy rule breached → `exception.detected`
  * Exception submitted → `exception.submitted`
  * Exception approved/denied → `exception.decision.made`
* INPUTS:
  * Breached rule ID `(exception.rule_id)`
  * Metrics at breach `(exception.metrics)`
  * Mitigants selected `(exception.mitigants)`
  * Approver `(exception.approver_id)`
* OUTPUTS:
  * Exception record and portfolio-level exception analytics.
* TIMERS/SLAs:
  * Exception must be decided before closing.
* EDGE CASES:
  * Multi-rule exceptions (e.g., DTI + FICO + LTV) must capture all breaches in single record.
* AUDIT LOGS:
  * `exception.logged`
  * `exception.approved`
* ACCESS CONTROL:
  * Only authorized approver roles may approve exceptions above their delegated limits.
* ALERTS/METRICS:
  * Metric: exception rate by product, channel, and partner; used in fair lending and credit risk review.

***

#### FL-09 — Documentation, Recordkeeping & Retention <a href="#fl-09-documentation-recordkeeping-retention" id="fl-09-documentation-recordkeeping-retention"></a>

* WHY (Reg cite): Reg B §1002.12; Reg C; FCRA; dossier file checklist.
* SYSTEM BEHAVIOR:
  * Enforce a “credit package” schema for every loan and prequal, including all required documents and calculated fields.
  * Apply retention rules: ≥25 months for apps, GMI, evaluation data, AA notices, prescreened solicitations (longer per CU standard).
* TRIGGERS:
  * File created → `credit_package.created`
  * File closed/denied → `credit_package.closed`
* INPUTS:
  * Required doc checklist `(credit_package.required_docs)`
  * Retention category `(record.retention_category)`
* OUTPUTS:
  * File completeness flag.
  * Retention/expiration schedule.
* TIMERS/SLAs:
  * All required docs must be present before booking.
  * Retention windows enforced in archival system.
* EDGE CASES:
  * Digitized legacy files: must be mapped into credit-package schema or labeled as “legacy”.
* AUDIT LOGS:
  * `credit_package.updated`
  * `record.archived`
* ACCESS CONTROL:
  * Role-based access to sensitive docs (GMI, income docs, etc.).
* ALERTS/METRICS:
  * Metric: file completeness at booking; missing-doc exception rates.

***

#### FL-10 — Pricing, Rate Sheets & HPML Controls <a href="#fl-10-pricing-rate-sheets-hpml" id="fl-10-pricing-rate-sheets-hpml"></a>

* WHY (Reg cite): Reg Z §§1026.35–36 (HPML, LO comp/steering); dossier pricing practices.
* SYSTEM BEHAVIOR:
  * Maintain weekly rate sheets tied to APOR and product credit boxes.
  * Run HPML and points-and-fees tests on covered mortgages before docs.
  * Enforce pricing-exception workflow with mitigants and approvals.
* TRIGGERS:
  * APOR import → `pricing.apor_imported`
  * Rate sheet updated → `pricing.matrix_updated`
  * Loan priced → `pricing.assigned`
* INPUTS:
  * APOR values `(pricing.apor_values)`
  * Product margins `(pricing.product_margin)`
  * Final rate and fees `(pricing.final_rate, pricing.fees)`
* OUTPUTS:
  * HPML flag `(pricing.hpml_flag)`
  * Pricing exception record when applicable.
* TIMERS/SLAs:
  * Rate sheets refreshed at least weekly. _(candidate operational standard)_
* EDGE CASES:
  * BaaS/partner pricing engines: must feed results into Pynthia’s HPML/exception engine as well.
* AUDIT LOGS:
  * `pricing.hpml_test.run`
  * `pricing.exception.approved`
* ACCESS CONTROL:
  * Only designated roles can edit rate sheets or margins.
* ALERTS/METRICS:
  * Metric: HPML incidence; pricing-exception rate by product/partner.

***

#### FL-11 — OFAC & Sanctions Gate <a href="#fl-11-ofac-sanctions-gate" id="fl-11-ofac-sanctions-gate"></a>

* WHY (Reg cite): BSA/OFAC; FFIEC guidance.
* SYSTEM BEHAVIOR:
  * For all new borrowers, run OFAC/sanctions check before closing; for existing well-known members, follow risk-based standard (may skip duplicate checks).
  * Capture override rationale when an apparent match is cleared.
* TRIGGERS:
  * New member/applicant added → `customer.created`
  * Pre-closing QC → `loan.preclose.qc_started`
* INPUTS:
  * Name, DOB, address `(customer.identifiers)`
  * OFAC match results `(ofac.match_result)`
* OUTPUTS:
  * OFAC screening record with result and timestamp.
* TIMERS/SLAs:
  * OFAC must be clear before funding.
* EDGE CASES:
  * Joint borrowers or guarantors: system must screen all obligors.
* AUDIT LOGS:
  * `ofac.check_run`
  * `ofac.override.recorded`
* ACCESS CONTROL:
  * Only BSA/Compliance or designated systems can alter OFAC configuration.
* ALERTS/METRICS:
  * Metric: count of matches and overrides; ensure they’re reviewed.

***

#### FL-12 — Prequalification, Marketing & Steering Controls <a href="#fl-12-prequalification-marketing-steering-controls" id="fl-12-prequalification-marketing-steering-controls"></a>

* WHY (Reg cite): Reg Z §1026.36(e) (LO steering), ECOA no-discouragement; Patrick: Steering Procedures.
* SYSTEM BEHAVIOR:
  * Implement prequalification based on neutral, documented criteria (e.g., score + DTI thresholds) with standard prequal letters.
  * Prohibit steering: system may not channel applicants into less favorable products based on prohibited bases or proxies.
  * Require that online and partner-facing product menus are designed not to discourage applications from any protected group.
* TRIGGERS:
  * Prequal request → `prequal.requested`
  * Prequal decision → `prequal.decision.made`
  * Product menu shown → `product.menu.rendered`
* INPUTS:
  * Prequal criteria `(prequal.criteria)`
  * Channel and partner `(application.channel, application.partner_id)`
* OUTPUTS:
  * Prequal letters.
  * Steering-control logs when system overrides or suggests alternative products.
* TIMERS/SLAs:
  * Prequal decisions issued within a short, defined SLA (e.g., minutes or hours).
* EDGE CASES:
  * When multiple products are suitable, system must show options without biasing toward more expensive ones solely for revenue.
* AUDIT LOGS:
  * `steering.control.check_run`
  * `prequal.letter.generated`
* ACCESS CONTROL:
  * Only product managers and Compliance can modify product-ranking algorithms.
* ALERTS/METRICS:
  * Metric: distribution of product selections vs eligibility across groups; used in steering reviews.

***

#### FL-13 — Fair Lending Risk Assessment & Monitoring <a href="#fl-13-fair-lending-risk-assessment-monitoring" id="fl-13-fair-lending-risk-assessment-monitoring"></a>

* WHY (Reg cite): ECOA, FHA, NCUA fair lending expectations; Patrick: “Fair Lending risk assessment”.
* SYSTEM BEHAVIOR:
  * Maintain data necessary for periodic quantitative and qualitative fair lending risk assessments (by product, channel, partner, geography).
  * Support independent fair lending reviews (e.g., using NCUA Fair Lending Guide) with reproducible datasets and logs.
* TRIGGERS:
  * Assessment cycle start → `flra.cycle_start`
  * Model or policy change → `flra.model_or_policy_changed`
* INPUTS:
  * App, approval, denial, pricing, and loss data with GMI where applicable `(flra.dataset)`
  * Partner and channel tags `(flra.segment_tags)`
* OUTPUTS:
  * FL risk assessment reports and remediation plans.
* TIMERS/SLAs:
  * Full FL risk assessment at least annually; targeted reviews as risk changes.
* EDGE CASES:
  * Smaller portfolios with sparse data: rely more on qualitative controls and benchmarking.
* AUDIT LOGS:
  * `flra.report.issued`
  * `flra.remediation.tracked`
* ACCESS CONTROL:
  * Access to sensitive FL analytics restricted to Compliance, Fair Lending, and senior management.
* ALERTS/METRICS:
  * Metric: number of identified FL risk issues open/closed; track remediation timeliness.

***

#### FL-14 — Insider Lending & Employee Conflicts <a href="#fl-14-insider-lending-employee-conflicts" id="fl-14-insider-lending-employee-conflicts"></a>

* WHY (Reg cite): NCUA safety & soundness; conflicts of interest; Patrick: “No insider loans to employees”.
* SYSTEM BEHAVIOR:
  * Implement a strict posture that Pynthia will not offer insider-only or preferential loan programs to employees.
  * (Assumption—needs confirmation: whether **all** loans to employees are prohibited, or only preferential/insider terms. This control is written to prohibit _preferential_ terms; if the intent is “no loans at all to employees,” the eligibility logic must be changed accordingly.)
  * Tag applications where borrower or co-borrower is an employee, officer, director, or related party and enforce standard or stricter underwriting and pricing (never looser).
* TRIGGERS:
  * App submitted → `application.created`
  * Applicant linked to employee record → `application.employee_match`
* INPUTS:
  * Employee/insider flags `(customer.employee_flag, customer.insider_flag)`
  * Relationship to CU `(customer.relationship_type)`
* OUTPUTS:
  * Employee/insider lending reports for governance.
* TIMERS/SLAs:
  * Insider flags must be resolved before decision.
* EDGE CASES:
  * Employee acting as co-borrower/guarantor for a non-employee: treat as insider relationship for monitoring but do not provide preferential treatment.
* AUDIT LOGS:
  * `insider.loan.flagged`
  * `insider.loan.reviewed`
* ACCESS CONTROL:
  * Insider lending reports accessible only to Board/Committee, CEO, CLO, and Compliance.
* ALERTS/METRICS:
  * Metric: count and volume of employee/insider loans; verify terms are not more favorable than comparable non-insider loans.

***

### EMBEDDED CHECKLISTS & TEMPLATES <a href="#checklists" id="checklists"></a>

Packs the team will assemble (driven by the merged dossier):

* Underwriting Bundle Checklist
  * Fields/docs required for each loan type (credit report, income docs by type, assets, DTI/LTV, collateral valuation, ATR/QM checklist for covered loans).
* ATR/QM Checklist
  * 8 ATR factors, DTI calc, QM classification, points-and-fees and HPML test logs.
* Adverse Action Checklist
  * AA reason mapping to file evidence, secondary review sign-off, FCRA score-disclosure template, mailing method/date capture.
* Appraisal & Valuation Checklist
  * Appraisal ordering, independence review, appraisal rights disclosure, copy delivery evidence, and retention tags.
* OFAC / Sanctions Checklist
  * Entities to screen (borrowers, co-borrowers, guarantors), override rationale fields, linkage to BSA/AML systems.
* Exceptions & Mitigants Template
  * Breached rule, measured metrics, mitigating factors selected, narrative justification, approver ID, date/time.
* Prequalification & Steering Checklist
  * Prequal criteria, standardized letter templates, product menu and ranking logic review questions.
* Fair Lending Risk Assessment Template
  * Dataset schema, segmentation specs (product, channel, partner, geography, GMI), methods used, remediation-tracking layout.

***

### GOVERNANCE & SIGN-OFF <a href="#governance" id="governance"></a>

* Owner: Chief Lending Officer (CLO) is the primary owner of this policy and responsible for operationalization in all lending systems and partner programs.
* Fair Lending / Compliance: Chief Compliance Officer / Fair Lending Officer is responsible for:
  * Ensuring alignment with ECOA/Reg B, FHA, TILA/Reg Z, HMDA/Reg C, FCRA, NCUA rules.
  * Coordinating annual Fair Lending Risk Assessments and independent reviews.
* Board / Committee Oversight:
  * Board (or designated Lending/Fair Lending Committee) approves this policy and any material changes.
  * Receives regular reports on:
    * Exceptions and mitigants (from [FL-08](lending.md#fl-08-exceptions-mitigants-overrides)),
    * Fair lending analytics and risk assessments (from [FL-13](lending.md#fl-13-fair-lending-risk-assessment-monitoring)),
    * Insider/employee lending activity (from [FL-14](lending.md#fl-14-insider-lending-employee-conflicts)).
* Review Cadence:
  * Policy reviewed at least annually and upon major regulatory or product changes.
* Partner / BaaS Alignment:
  * All fintech and BaaS partners must agree by contract to adhere to this policy or stricter equivalent standards.
  * Pynthia retains ultimate responsibility for fair lending and loan decisioning across all programs.

***

### ASSUMPTIONS & GAPS

* DTI Standards: Dossier includes both 35% and 43% DTI guidelines; this policy treats 43% as the primary consumer DTI guideline with capacity for stricter overlays (e.g., 35% mortgage or product-specific DTIs). _(Assumption—needs confirmation: which DTI tier(s) Pynthia will adopt as default vs exception.)_
* Product LTV / Term Tables: Specific LTV/term limits (autos, HELOCs, lots, physician loans, etc.) are treated as configurable parameters seeded from the dossier. They must be calibrated to Pynthia’s actual risk appetite and product set. _(Needs parameterization.)_
* Non-Accrual & Charge-Off Timers: 90/120-day triggers and OREO appraisal timelines are imported as candidate rules from a community-bank context; Pynthia must confirm alignment with its accounting and collection standards.
* Insider Loans to Employees: Patrick’s requirement is “No insider loans to employees.” This draft implements a no preferential insider loan posture; if the intent is to prohibit all loans to employees, eligibility logic and HR/member linking must be tightened and documented.
* Frequency of Fair Lending Risk Assessments: Policy assumes at least annual FL risk assessment; Pynthia may choose a more frequent cadence based on risk.
