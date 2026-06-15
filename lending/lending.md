---
title: Lending Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v3.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Lending, Fair Lending, Underwriting, Adverse Action, ATR/QM, Pricing, OFAC, Insider Lending]
---

## General Policy Statement

Pynthia Credit Union extends credit only on a safe-and-sound, non-discriminatory basis, using neutral creditworthiness factors and never a prohibited basis or proxy. This policy governs acceptance, denial, pricing, valuation, exception, and insider-conflict controls across all credit products and channels — direct, fintech-partner, and white-label/BaaS — and serves as the design specification for Pynthia's lending systems and partner integrations. Steering, discriminatory product placement, and preferential insider loans are prohibited. Collections, BSA/AML program governance beyond the lending OFAC gate, general fair-lending program methodology, member onboarding/CIP, deposit disclosures, general retention scheduling, and third-party onboarding are governed by their respective policies and are out of scope here.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Adverse action on completed application | Application decisioned adversely (`loan_application.adverse_action_decided`) | 30 days | ECOA/Reg B §1002.9 + FCRA content | [LD-07](#ld-07-adverse-action-notifications) |
| Adverse action after unaccepted counteroffer | Counteroffer expires unaccepted (`application.counteroffer_expired`) | 90 days from counteroffer | ECOA/Reg B §1002.9(a)(1)(iv) | [LD-07](#ld-07-adverse-action-notifications) |
| Incomplete application notice | Incompleteness detected (`loan_application.incomplete_detected`) | 30 days | ECOA/Reg B §1002.9(c) | [LD-03](#ld-03-applications-acceptance-and-denial-standards) |
| First-lien dwelling appraisal copy | Appraisal completed (`appraisal.completed`) | Promptly, ≥3 business days before consummation | ECOA/Reg B §1002.14 | [LD-06](#ld-06-appraisals-valuations-and-collateral) |
| ATR/QM checklist on covered mortgage | ATR/QM evaluation completed (`loan_application.atr_qm_completed`) | Before docs print | TILA/Reg Z §1026.43 | [LD-05](#ld-05-atrqm-and-mortgage-underwriting) |
| HPML / points-and-fees test on covered mortgage | HPML test run (`loan_pricing.hpml_tested`) | Before docs print | TILA/Reg Z §1026.35, §1026.43 | [LD-10](#ld-10-pricing-rate-sheets-and-hpml-controls) |
| OFAC clearance on obligors | Loan party screened (`loan_party.ofac_screened`) | Before funding | 31 CFR Chapter V | [LD-11](#ld-11-ofac-and-sanctions-gate) |
| Governance mapping after new product/program | Lending program activated (`lending_program.activated`) | 30 days | NCUA Parts 701/741/748 | [LD-01](#ld-01-governance-roles-and-program-scope) |
| Annual fair-lending risk assessment | FL assessment cycle due (`fair_lending.assessment_due`) | Annually | ECOA §1002.4; FHA 42 USC §3605 | [LD-13](#ld-13-fair-lending-risk-assessment-and-monitoring) |

## LD-01 — Governance, Roles & Program Scope  {#ld-01-governance-roles-and-program-scope}

- **WHY (Reg cite):** NCUA safety-and-soundness, reporting, and security expectations require named control ownership and program scoping ([NCUA Part 701](https://www.ecfr.gov/current/title-12/part-701), [Part 741](https://www.ecfr.gov/current/title-12/part-741), [Part 748](https://www.ecfr.gov/current/title-12/part-748)); ECOA/Reg B requires a non-discriminatory credit program across all channels ([12 CFR §1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4)).
- **SYSTEM BEHAVIOR:** Every lending and fair-lending control maps to a named owner in a RACI registry, and every product/program — including BaaS partners — is tagged with scope flags at activation. Credit-parameter and pricing-engine changes are gated behind authorized roles and an approval record. The policy is reviewed at least annually, and governance mapping is updated within 30 days of any new product or program. Credit-parameter and pricing-engine configuration is write-restricted to the Chief Lending Officer and authorized Loan Operations roles; the RACI registry is write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | New lending program or BaaS partner activated (`lending_program.activated`) | Program/partner identity (`lending_program.partner_id`, `lending_program.id`), channel (`lending_program.channel`), RACI registry (`policy.raci_registry`) | Governance mapping with scope flags (`lending_program.governance_mapped`) | 30 days (enforced by `lending_program.governance_due_at`) |
  | Annual policy review cycle reached (`policy.board_review_started`) | Current policy version (`policy.document_version`), owner mapping (`policy.owner_ref`) | Board-approved policy version (`policy.board_approved`) | Annual (enforced by `governance.policy_review_due`) |
  | Credit/pricing config change requested (`credit_config.change_requested`) | Proposed diff (`credit_config.diff`), authorized approver (`credit_config.approval_id`) | Activated config change (`credit_config.changed`) | Internal: prior to deployment (—) |
- **ALERTS/METRICS:** Alert when governance mapping for a new program exceeds the 30-day SLA (`alert.policy_review_aging`); target zero unowned controls (`risk.ownership_gap_detected`) and zero unauthorized credit-config changes.

## LD-02 — Product Eligibility & Prohibited Practices  {#ld-02-product-eligibility-and-prohibited-practices}

- **WHY (Reg cite):** A documented, neutral product credit box and a hard block on predatory/prohibited products supports safe-and-sound lending under [NCUA Part 701](https://www.ecfr.gov/current/title-12/part-701) and prevents discriminatory product placement under ECOA/Reg B ([12 CFR §1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4)).
- **SYSTEM BEHAVIOR:** A machine-readable credit box per product (collateral, LTV, terms) governs eligibility, and the system blocks applications for explicitly prohibited products — payday, vehicle-title, tax RALs, defined private education loans, and stated-income/no-doc. The credit box is reviewed at least annually. Credit-box definitions are write-restricted to Compliance and the Chief Lending Officer. A blocked product application is recorded and never advanced to decisioning.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Application screened against product rules (`loan_application.product_screened`) | Requested product (`loan_application.product_code`, `loan_application.product_type`), credit box (`credit_box.definition`) | Screen result; prohibited product blocked (`loan_application.product_screened`) | Internal: at intake (—) |
  | Credit box review cycle reached (`credit_box.review_completed`) | Current credit box version (`credit_box.version`), collateral/LTV/term rules (`credit_box.definition`) | Reviewed credit box (`credit_box.review_completed`) | Annual (enforced by `credit_box.review_due`) |
- **ALERTS/METRICS:** Target zero advancement of prohibited-product applications past intake; alert on credit-box review aging (`credit_box.review_due`) approaching the annual deadline.

## LD-03 — Applications, Acceptance & Denial Standards  {#ld-03-applications-acceptance-and-denial-standards}

- **WHY (Reg cite):** ECOA/Reg B requires evaluation on neutral creditworthiness factors and a decision on a completed application within 30 days ([12 CFR §1002.6](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6), [§1002.9](https://www.ecfr.gov/current/title-12/part-1002#p-1002.9)); incomplete-application handling is governed by [§1002.9(c)](https://www.ecfr.gov/current/title-12/part-1002#p-1002.9).
- **SYSTEM BEHAVIOR:** A standardized underwriting bundle (application data, credit, income/assets, DTI, collateral/LTV, OFAC, ATR/QM) is summarized into a CAR-equivalent object, and decisions rest on neutral factors only. Completed applications are decided within 30 days; when an application is incomplete, a notice of incompleteness is sent instead of an adverse-action notice. The decision basis (`loan_application.action_basis`) is write-restricted to underwriting roles, and prohibited-basis fields never enter the decision.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Application completed and ready for decision (`loan_application.completed`) | Underwriting bundle (`loan_application.data`, `loan_application.income_assets`, `loan_application.dti`, `loan_application.credit_structure`), neutral decision basis (`loan_application.action_basis`) | CAR-equivalent object sealed (`car.sealed`); decision recorded (`loan_application.decisioned`) | 30 days (enforced by `loan_application.decision_due_at`) |
  | Incomplete application detected (`loan_application.incomplete_detected`) | Missing-item list (`loan_application.data`), applicant contact (`applicant.contact`) | Incompleteness notice (`loan_application.incompleteness_notice_sent`) | 30 days (enforced by `application.notice_due_at`) |
- **ALERTS/METRICS:** Aging alert as decisions approach the 30-day deadline (`loan_application.decision_due_at`); monitor decision-latency distribution and target zero overdue decisions.

## LD-04 — Credit Scoring & Adverse Credit History  {#ld-04-credit-scoring-and-adverse-credit-history}

- **WHY (Reg cite):** ECOA/Reg B permits empirically derived, demonstrably sound scoring used as one factor among neutral creditworthiness criteria ([12 CFR §1002.6(b)](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6)); credit-report-based decisions trigger FCRA notice obligations ([15 USC §1681m](https://www.law.cornell.edu/uscode/text/15/1681m)).
- **SYSTEM BEHAVIOR:** Empirically derived scores act as a secondary check, not the sole decision driver, applying configurable FICO bands and derogatory-credit tolerances (e.g., bankruptcy seasoning, small medical judgments) with exception routing. Credit reports must be no older than 6 months at decision, and alternative credit data is supported for thin-file borrowers. Score bands, seasoning rules, and tolerances are write-restricted to Compliance and the Chief Lending Officer.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Credit report received (`credit_report.received`) | Report date (`credit_report.report_date`), score disclosure (`credit_report.score_disclosure`) | Freshness check result (`credit_report.freshness_checked`) | ≤6 months at decision (enforced by `credit_report.stale_at`) |
  | Derogatory-credit tolerance breached (`credit_score.tolerance_breached`) | FICO bands (`credit_config.fico_bands`), seasoning rules (`credit_config.seasoning_rules`), observed history (`loan_application.credit_structure`) | Exception routed to LD-08 (`loan_exception.detected`) | Internal: before decision (—) |
  | Thin-file applicant detected (`loan_application.thin_file_flagged`) | Alternative credit inputs (`loan_application.income_assets`, `prequal.inputs`) | Alternative-data use recorded (`car.alternative_data_used`) | Internal: at underwriting (—) |
- **ALERTS/METRICS:** Alert on any decision using a stale credit report (>6 months); monitor proportion of decisions where score is the sole driver (target zero) and thin-file alternative-data usage rate.

## LD-05 — ATR/QM & Mortgage Underwriting  {#ld-05-atrqm-and-mortgage-underwriting}

- **WHY (Reg cite):** TILA/Reg Z requires an ability-to-repay determination using the 8 factors and a QM classification for covered closed-end 1–4 family dwelling-secured consumer credit ([12 CFR §1026.43](https://www.ecfr.gov/current/title-12/part-1026#p-1026.43)).
- **SYSTEM BEHAVIOR:** For covered closed-end 1–4 family dwelling-secured loans, the system requires the ATR 8-factor checklist and a QM classification, applies a 43% consumer DTI default with capacity for stricter configurable tiers (e.g., 35% mortgage), and blocks document printing until the ATR checklist is complete. DTI tiers are write-restricted to Compliance and the Chief Lending Officer. Non-covered products skip the ATR gate by product-type rule.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | ATR/QM evaluation completed (`loan_application.atr_qm_completed`) | 8-factor inputs (`loan_application.income_assets`, `loan_application.employment`, `loan_application.dti`), DTI tiers (`credit_config.dti_tiers`), result (`loan_application.atr_qm_result`) | ATR/QM classification recorded; doc-print block held until complete (`loan_application.atr_qm_completed`) | Before docs print (enforced by `loan_application.doc_block_state`) |
  | DTI threshold breached on covered loan (`loan_application.dti_breached`) | Observed DTI (`loan_application.dti`), tier configuration (`credit_config.dti_tiers`) | Exception routed to LD-08 (`loan_exception.detected`) | Internal: before decision (—) |
- **ALERTS/METRICS:** Target zero covered-loan doc prints without a completed ATR checklist; monitor QM-vs-non-QM classification mix and DTI-exception volume.

## LD-06 — Appraisals, Valuations & Collateral  {#ld-06-appraisals-valuations-and-collateral}

- **WHY (Reg cite):** ECOA/Reg B requires free, prompt delivery of appraisals and valuations for first-lien dwelling-secured credit ([12 CFR §1002.14](https://www.ecfr.gov/current/title-12/part-1002#p-1002.14)); appraisal independence and anti-redlining apply under [NCUA §701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31) and the [Fair Housing Act, 42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605).
- **SYSTEM BEHAVIOR:** The system enforces appraisal independence and an approved-appraiser list, auto-generates and promptly delivers free appraisal copies for first-lien dwellings (retained ≥25 months), and enforces configurable product LTV matrices. The approved-appraiser list and LTV matrices are write-restricted to Compliance and the Chief Lending Officer. The applicant may waive the 3-business-day-before-consummation timing in writing, in which case prompt post-consummation delivery applies.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | First-lien dwelling appraisal completed (`appraisal.completed`) | Appraisal document (`appraisal.document`), value (`appraisal.value`), applicant contact (`applicant.contact`) | Free appraisal copy delivered (`appraisal.copy_delivered`) | Promptly; ≥3 BD before consummation (enforced by `appraisal.delivery_due_at`) |
  | Collateral LTV checked against matrix (`collateral.ltv_checked`) | Collateral value (`loan.collateral_value`), LTV (`loan.ltv`), LTV matrix (`credit_config.ltv_matrix`) | LTV check result; breach routed to LD-08 (`collateral.ltv_checked`) | Internal: before decision (—) |
- **ALERTS/METRICS:** Aging alert as appraisal delivery approaches the regulatory deadline (`appraisal.delivery_due_at`); target zero deliveries to off-list appraisers and zero late copies.

## LD-07 — Adverse Action & Notifications  {#ld-07-adverse-action-notifications}

- **WHY (Reg cite):** ECOA/Reg B sets adverse-action content and timing — 30 days on completed applications and existing-account actions, 90 days for an unaccepted counteroffer ([12 CFR §1002.9](https://www.ecfr.gov/current/title-12/part-1002#p-1002.9)); FCRA requires credit-based reasons and disclosures ([15 USC §1681m / §615(a)](https://www.law.cornell.edu/uscode/text/15/1681m)).
- **SYSTEM BEHAVIOR:** The system enforces ECOA/Reg B and FCRA adverse-action content and timing — 30 days for completed applications and existing-account adverse action, and 90 days post-counteroffer if not accepted — and requires second-level review of all denials for consistency and fair-lending concerns. A counteroffer accepted within its window requires no adverse-action notice. AAN content templates are write-restricted to Compliance, and the second-review queue is restricted to authorized reviewers.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Application decisioned adversely (`loan_application.adverse_action_decided`) | Applicant identity (`loan_application.applicant`), decision basis (`loan_application.action_basis`), credit-report indicator (`credit_report.score_disclosure`) | AAN with specific reasons + ECOA/FCRA notice (`aan.issued`) | 30 days (enforced by `loan_application.aan_due_at`) |
  | Counteroffer expired unaccepted (`application.counteroffer_expired`) | Counteroffer terms (`loan_application.counteroffer_terms`), status (`loan_application.counteroffer_status`) | AAN issued (`aan.issued`) | 90 days from counteroffer (enforced by `loan_application.counteroffer_aan_due_at`) |
  | Existing-account adverse action decided (`loan_account.adverse_action_decided`) | Account action basis (`loan.action_basis`), member identity (`loan_party.identity`) | AAN issued (`aan.issued`) | 30 days (enforced by `loan_account.aan_due_at`) |
  | Denial queued for second-level review (`aan.queued`) | Decision basis (`loan_application.action_basis`), fair-lending consistency inputs (`loan_application.gmi`) | Second review completed (`aan.second_review_completed`) | Internal: before AAN issuance (—) |
- **ALERTS/METRICS:** Aging alert as AAN deadlines approach (`loan_application.aan_due_at`, `loan_application.counteroffer_aan_due_at`); target zero late notices and 100% second-review coverage on denials.

## LD-08 — Exceptions, Mitigating Factors & Overrides  {#ld-08-exceptions-mitigating-factors-and-overrides}

- **WHY (Reg cite):** Consistent, documented exception handling prevents disparate treatment under ECOA/Reg B ([12 CFR §1002.6](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6)) and supports safe-and-sound underwriting under [NCUA Part 701](https://www.ecfr.gov/current/title-12/part-701).
- **SYSTEM BEHAVIOR:** The system automatically detects breaches of numeric/qualitative rules (DTI, FICO, LTV, bankruptcy seasoning, product restrictions), requires standardized mitigant selection and tiered approval routing, decides exceptions before closing, and produces portfolio-level exception analytics. Exception approval authority is restricted by tier (`loan_exception.approval_tier`); closing is blocked until the exception is decided (`loan_exception.closing_block_state`).
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Rule breach detected (`loan_exception.detected`) | Breached rule (`loan_exception.rule`), observed value (`loan_exception.observed_value`) | Exception case opened (`loan_exception.case_opened`) | Internal: at detection (—) |
  | Exception submitted with mitigant (`loan_exception.submitted`) | Mitigant selection (`exception.rationale`), approval tier (`loan_exception.approval_tier`) | Exception decided (`loan_exception.decided`) | Before closing (enforced by `loan_exception.closing_block_state`) |
  | Exception reporting cycle reached (`loan_exception.analytics_published`) | Exception register (`exception.registered`), portfolio scope (`portfolio.performance_metrics`) | Portfolio exception analytics (`loan_exception.analytics_published`) | Internal periodic (enforced by `loan_exception.analytics_due`) |
- **ALERTS/METRICS:** Target zero closings with an undecided exception; monitor exception rate by product/channel/partner for fair-lending disparity and approval-tier compliance.

## LD-09 — Documentation, Recordkeeping & Retention  {#ld-09-documentation-recordkeeping-and-retention}

- **WHY (Reg cite):** ECOA/Reg B requires retention of applications, evaluation data, GMI, and adverse-action records for at least 25 months ([12 CFR §1002.12](https://www.ecfr.gov/current/title-12/part-1002#p-1002.12)); HMDA recordkeeping applies to covered dwelling-secured credit ([12 CFR §1003.5](https://www.ecfr.gov/current/title-12/part-1003#p-1003.5)).
- **SYSTEM BEHAVIOR:** The system enforces a credit-package schema for every loan and prequal, requires all documents before booking, and applies retention of ≥25 months for applications, GMI, evaluation data, and AA notices (longer per credit-union standard). Booking is blocked until the required document set is complete. The credit-package schema is write-restricted to Compliance, and retention timers are system-managed.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Credit package assembled for booking (`credit_package.validated`) | Package schema (`credit_package.schema`), required documents (`document.required_set`) | Validated package; booking block held until complete (`credit_package.validated`) | Before booking (enforced by `loan_application.doc_block_state`) |
  | Retention clock started on credit package (`credit_package.retention_started`) | Record class (`record.retention_class`), anchor date (`record.retention_anchor` / `retention_spec.anchor_date`) | Retention timer set (`record.retention_clock_set`) | ≥25 months (enforced by `credit_package.retention_expires_at`) |
- **ALERTS/METRICS:** Target zero bookings with an incomplete document set; alert on records approaching destruction before the ≥25-month floor (`record.retention_expires_at`).

## LD-10 — Pricing, Rate Sheets & HPML Controls  {#ld-10-pricing-rate-sheets-and-hpml-controls}

- **WHY (Reg cite):** TILA/Reg Z governs HPML thresholds tied to APOR and points-and-fees limits ([12 CFR §1026.35](https://www.ecfr.gov/current/title-12/part-1026#p-1026.35), [§1026.43](https://www.ecfr.gov/current/title-12/part-1026#p-1026.43)); loan-originator compensation and anti-steering rules apply ([§1026.36(d),(e)](https://www.ecfr.gov/current/title-12/part-1026#p-1026.36)).
- **SYSTEM BEHAVIOR:** The system maintains weekly APOR-tied rate sheets, runs HPML and points-and-fees tests on covered mortgages before document printing, and enforces a pricing-exception workflow with mitigants and approvals across direct and partner pricing engines. Pricing-exception approval authority is restricted to authorized roles (`pricing.exception_approver`); rate-sheet publication is write-restricted to Treasury/Pricing roles.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Weekly rate-sheet refresh reached (`rate_sheet.apor_published`) | APOR values (`rate_sheet.apor_values`), pricing margins (`credit_config.margins`) | Published APOR-tied rate sheet (`rate_sheet.published`) | Weekly (enforced by `rate_sheet.refresh_due_at`) |
  | HPML / points-and-fees test run on covered mortgage (`loan_pricing.hpml_tested`) | Proposed APR (`loan_pricing.apr`), points and fees (`loan_pricing.points_fees`), APOR (`rate_sheet.apor_values`) | HPML/P&F test result (`loan_pricing.hpml_tested`) | Before docs print (enforced by `loan_application.doc_block_state`) |
  | Pricing exception requested (`loan_pricing.exception_requested`) | Sheet vs proposed price (`pricing.sheet_price`, `pricing.proposed_price`), rationale (`pricing.exception_rationale`), approver (`pricing.exception_approver`) | Pricing exception decided (`loan_pricing.exception_decided`) | Internal: before lock (enforced by `pricing.exception_review_due_at`) |
- **ALERTS/METRICS:** Alert on stale rate sheet beyond the weekly window (`rate_sheet.refresh_due_at`); monitor pricing-exception demographics summary (`pricing.exception_demographics_summary`) for disparity and target zero undecided HPML loans at doc print.

## LD-11 — OFAC & Sanctions Gate  {#ld-11-ofac-and-sanctions-gate}

- **WHY (Reg cite):** OFAC sanctions regulations require screening of obligors and a block/clearance before funding ([31 CFR Chapter V](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-V); FFIEC BSA/AML Manual).
- **SYSTEM BEHAVIOR:** The system screens all new borrowers, co-borrowers, and guarantors before closing, requires clearance before funding, and captures override rationale when an apparent match is cleared. Funding is blocked while any obligor is unscreened or unresolved. OFAC clearance and override authority is restricted to BSA/Compliance roles; apparent matches escalate rather than auto-clear.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Loan party screened (`loan_party.ofac_screened`) | Party identity (`loan_party.identity`), list version (`ofac_control_context.list_version`) | Screen result; clear or escalate (`loan_party.ofac_cleared` / `loan_party.ofac_escalated`) | Before closing (—) |
  | Apparent match cleared by override (`loan_party.ofac_cleared`) | Match result (`loan_party.ofac_result`), override rationale (`override.rationale`), approver (`override.senior_approver_id`) | Override decision recorded (`override.senior_decision_recorded`) | Before funding (—) |
- **ALERTS/METRICS:** Target zero fundings with an unscreened or unresolved obligor; alert on any apparent match cleared without recorded override rationale and monitor match-clearance latency.

## LD-12 — Prequalification, Marketing & Steering Controls  {#ld-12-prequalification-marketing-and-steering-controls}

- **WHY (Reg cite):** ECOA/Reg B prohibits discouragement and prohibited-basis steering ([12 CFR §1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4), [§1002.5](https://www.ecfr.gov/current/title-12/part-1002#p-1002.5)); Reg Z anti-steering applies ([12 CFR §1026.36(e)](https://www.ecfr.gov/current/title-12/part-1026#p-1026.36)); advertising must not discourage protected groups ([§1026.24](https://www.ecfr.gov/current/title-12/part-1026#p-1026.24)); FHA bars discriminatory dwelling-credit marketing ([42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605)).
- **SYSTEM BEHAVIOR:** Prequalification rests on neutral documented criteria, steering into less favorable products by prohibited bases or proxies is prohibited, and online and partner product menus are reviewed so they do not discourage protected groups. Prequal criteria versions and product-menu definitions are write-restricted to Compliance. A steering review runs before any product-menu deployment.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Prequalification decided (`prequal.decided`) | Neutral criteria version (`prequal.criteria_version`), inputs (`prequal.inputs`), product mapping (`prequal.product_mapping`) | Prequal decision recorded (`prequal.decided`) | Internal: at request (—) |
  | Product-menu change requested (`product_menu.change_requested`) | Menu diff (`product_menu.diff`), outcome metrics (`product_menu.outcome_metrics`) | Steering review completed; menu deployed (`steering_review.completed`, `product_menu.deployed`) | Internal: before deployment (enforced by `steering_review.due`) |
  | Discouragement pattern reported (`fair_lending.discouragement_reported`) | Channel/menu outcome metrics (`product_menu.outcome_metrics`), finding (`fair_lending.finding_id`) | Discouragement finding recorded (`fair_lending.discouragement_reported`) | Internal periodic (—) |
- **ALERTS/METRICS:** Target zero product-menu deployments without a completed steering review; monitor product-placement outcome metrics by protected-class proxy for disparity.

## LD-13 — Fair Lending Risk Assessment & Monitoring  {#ld-13-fair-lending-risk-assessment-and-monitoring}

- **WHY (Reg cite):** ECOA/Reg B requires GMI collection on covered dwelling-secured applications and prohibits discrimination ([12 CFR §1002.13](https://www.ecfr.gov/current/title-12/part-1002#p-1002.13), [§1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4)); HMDA data collection applies to covered credit ([12 CFR §1003.5](https://www.ecfr.gov/current/title-12/part-1003#p-1003.5)); the Fair Housing Act bars discrimination in dwelling-secured credit ([42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605)).
- **SYSTEM BEHAVIOR:** The system maintains reproducible application, approval, denial, pricing, and loss data with GMI by product, channel, partner, and geography, runs a full fair-lending risk assessment at least annually, and tracks remediation to closure. GMI is collected and stored separately from the decision path so it never influences underwriting. The fair-lending dataset and disparity thresholds are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | GMI recorded on covered application (`hmda.gmi_recorded`) | GMI responses (`loan_application.gmi`, `applicant.gmi_responses`), product/channel/geography (`loan_application.product_type`, `loan_application.channel`, `loan_application.geography`) | GMI record appended to fair-lending dataset (`fair_lending.record_appended`) | Internal: at application (—) |
  | Annual fair-lending assessment due (`fair_lending.assessment_completed`) | Dataset version (`fair_lending.dataset_version`), disparity thresholds (`compliance.disparity_thresholds`) | Completed assessment (`fair_lending.assessment_completed`) | Annual (enforced by `fair_lending.assessment_due`) |
  | Disparity threshold breached (`analytics.threshold_breached`) | Disparity metrics (`analytics.lending_dataset`, `analytics.cohort_threshold`), finding (`fair_lending.finding_id`) | Remediation opened (`fair_lending.remediation_opened`) | Internal (enforced by `fair_lending.remediation_due_at`) |
- **ALERTS/METRICS:** Alert as the annual assessment approaches its deadline (`fair_lending.assessment_due`); monitor open fair-lending remediation aging and disparity-threshold breach counts (target zero unremediated breaches).

## LD-14 — Insider Lending & Employee Conflicts  {#ld-14-insider-lending-and-employee-conflicts}

- **WHY (Reg cite):** NCUA insider-practice expectations require no preferential terms and reporting of insider credit ([NCUA Part 701](https://www.ecfr.gov/current/title-12/part-701), [Part 741](https://www.ecfr.gov/current/title-12/part-741)); ECOA/Reg B neutral-factor evaluation applies equally to insiders ([12 CFR §1002.6](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6)).
- **SYSTEM BEHAVIOR:** The system implements a no-preferential-terms posture for employees, officers, directors, and related parties; tags and resolves insider flags before decision; never applies looser underwriting or pricing; and reports insider/employee lending activity to governance. An application with an unresolved insider flag is blocked from decisioning until parity is confirmed. Insider terms-parity checks and board reporting are write-restricted to Compliance; insider records are restricted to authorized governance roles.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Application screened for insider status (`loan_application.insider_screened`) | Party identity (`loan_party.identity`), insider roster (`covered_person.designated`) | Insider flag set or cleared (`loan_application.insider_flagged`) | Internal: before decision (—) |
  | Insider terms parity checked (`insider.terms_parity_checked`) | Proposed terms (`insider.proposed_terms`), comparable market terms (`insider.comparable_terms`) | Parity check recorded; board approval if required (`insider.board_approval_recorded`) | Internal: before decision (—) |
  | Insider lending reporting cycle reached (`insider.board_report_issued`) | Insider credit activity (`insider.aggregate_credit_amount`, `insider.funded_terms`) | Board report issued (`insider.board_report_issued`) | Internal periodic (enforced by `insider_report.due`) |
- **ALERTS/METRICS:** Target zero insider loans decisioned with looser terms than comparable market terms; alert on any application advancing with an unresolved insider flag and monitor insider-report cadence.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer (also serving as Fair Lending Officer).
- **Approvers:** Patrick Wilson, Chief Compliance Officer.
- **Required participants:** Chief Lending Officer, Loan Operations, Underwriting, BSA/Compliance, and the Board (or Lending/Fair Lending Committee) as required.
- **Review cadence:** At least annually; governance mapping updated within 30 days of any new product or program (see [LD-01](#ld-01-governance-roles-and-program-scope)).
- **Cross-refs:** Adverse-action and counteroffer deadlines consolidated in the [Timing Matrix](#timing-matrix). Out-of-scope workflows (collections, BSA/AML program governance, fair-lending methodology, member/CIP onboarding, deposit disclosures, general retention scheduling, third-party onboarding) are governed by their respective policies.

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional (composed codes).** The following codes are coined under the Composition grammar (registered subject + registered verb/task type) because no registered or provisional code exactly fit and must be confirmed/registered by engineering before the next review: `lending_program.governance_due_at` (subject `program_governance` + task `review`), `credit_box.review_due` / `credit_box.next_review_at`, `car.sealed` / `car.alternative_data_used` (registered events; `car.*` subject registered), `loan_exception.analytics_due`. Where a registered or agreed-provisional spelling existed (e.g., `application.counteroffer_status`, `application.product_type`, `application.incomplete_aged`, `credit_box.version`, `credit_report.id/score`), the exact provisional spelling was used per the provisional-codes list.
- **Provisional vocabulary used verbatim.** Several fields referenced above appear in the DESIGN_NOTES "Provisional codes" list rather than the registered spec (e.g., `application.counteroffer_terms`, `application.counteroffer_status`, `application.product_type`, `credit_box.version`, `credit_report.id`, `lending_program.channel`, `lending_program.id`). These spellings are used exactly as agreed and are flagged here collectively rather than re-coined.
- **Entity-mapping ambiguity (loan_application vs application).** The vocabulary registers parallel `application.*` and `loan_application.*` event families (e.g., `application.notice_due_at` vs `loan_application.incompleteness_notice_sent`). This policy uses `loan_application.*` for the lending decision path and `application.*` only where the registered timer lives under that subject; engineering to confirm which family is canonical for lending so the two are not double-implemented.
- **Charter and NCUA Part 701.31 applicability.** This policy assumes Pynthia is a federally insured credit union subject to NCUA Parts 701, 741, and 748, and that §701.31 (nondiscrimination in real-estate lending) applies. Confirm charter type and §701.31 applicability.
- **HMDA reporter status.** This policy assumes Pynthia is (or may become) a HMDA reporter and provisions GMI/LAR data accordingly (LD-13). Confirm reporter status and LAR-submission applicability; if a non-reporter, the HMDA-specific data flows are retained for fair-lending analytics only.
- **Appraisal-waiver timing.** The "≥3 business days before consummation" delivery default and the written-waiver carve-out (LD-06) assume the Reg B §1002.14 timing convention. Confirm Pynthia's standard delivery SLA and waiver handling.
- **Partner/BaaS scope-flag taxonomy.** LD-01 assumes a scope-flag schema exists for tagging direct, fintech-partner, and white-label/BaaS programs. The specific risk-tier and scope-flag definitions are not enumerated here and need confirmation; partner onboarding and ongoing due diligence remain governed by the Third-Party Risk Policy.
- **Pricing-exception demographic monitoring.** LD-10 relies on `pricing.exception_demographics_summary` for disparity monitoring; confirm that demographic summaries are derived from GMI in a manner that does not feed the pricing decision path.
