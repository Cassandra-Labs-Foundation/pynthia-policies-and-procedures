---
title: Lending Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Lending, Fair-Lending, ECOA, ATR-QM, Adverse-Action]
---

## General Policy Statement

Pynthia Credit Union extends credit on a safe-and-sound, non-discriminatory basis, basing every acceptance and denial on neutral creditworthiness factors only. This policy governs all credit products and channels — direct, fintech-partner, and white-label/BaaS programs — and serves as the design spec for Pynthia's lending systems and partner integrations. Steering, discriminatory product placement, and preferential insider lending are prohibited. Out-of-scope matters (collections, BSA/AML program governance, fair-lending analytics methodology, member onboarding/CIP, Truth-in-Savings, general record-retention schedules, and third-party onboarding/due diligence) are governed by their respective policies.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Adverse action on completed application | Application decided adversely (`loan_application.adverse_action_decided`) | 30 days | ECOA/Reg B §1002.9; FCRA §615(a) content | [LN-07](#ln-07-adverse-action-notifications) |
| Counteroffer not accepted | Counteroffer expires unaccepted (`loan_application.counteroffer_expired`) | 90 days from counteroffer | ECOA/Reg B §1002.9(a)(1)(iv) | [LN-07](#ln-07-adverse-action-notifications) |
| Completed application decision | Application complete (`loan_application.completed`) | 30 days | ECOA/Reg B §1002.9 timing | [LN-03](#ln-03-applications-acceptance-denial-standards) |
| First-lien dwelling appraisal copy | Appraisal completed (`appraisal.completed`) | Promptly / ≥3 BD before consummation | ECOA/Reg B §1002.14 | [LN-06](#ln-06-appraisals-valuations-collateral) |
| OFAC clearance before funding | Loan party screened (`loan_party.ofac_screened`) | Before funding | 31 CFR Ch. V | [LN-11](#ln-11-ofac-sanctions-gate) |
| ATR/QM completion | Docs requested on covered loan (`loan_application.docs_requested`) | Before docs print | TILA/Reg Z §1026.43 | [LN-05](#ln-05-atr-qm-mortgage-underwriting) |
| HPML test on covered mortgage | Pricing locked (`loan_pricing.locked`) | Before docs print | TILA/Reg Z §1026.35 | [LN-10](#ln-10-pricing-rate-sheets-hpml-controls) |
| New product/program governance map | Program activated (`lending_program.activated`) | 30 days | NCUA safety & soundness | [LN-01](#ln-01-governance-roles-program-scope) |
| Credit-package retention | Loan booked (`loan.booking_requested`) | ≥25 months | ECOA/Reg B §1002.12 | [LN-09](#ln-09-documentation-recordkeeping-retention) |
| Annual fair-lending assessment | Assessment cycle due (`fair_lending.assessment_due`) | Annual | ECOA; FHA; NCUA §701.31 | [LN-13](#ln-13-fair-lending-risk-assessment-monitoring) |

## LN-01 — Governance, Roles & Program Scope  {#ln-01-governance-roles-program-scope}

- **WHY (Reg cite):** NCUA safety-and-soundness and insider-practice expectations require clear ownership, board oversight, and program-scope tagging for all lending and fair-lending controls ([NCUA Parts 701/741/748](https://www.ecfr.gov/current/title-12/part-701); [12 CFR §701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31)); ECOA/Reg B grounds the nondiscriminatory posture these roles enforce ([12 CFR Part 1002](https://www.ecfr.gov/current/title-12/part-1002)).
- **SYSTEM BEHAVIOR:** Each lending and fair-lending control maps to a named owner in a RACI registry; every product and program (including BaaS partners) is tagged with scope flags identifying channel and partner. New products/programs trigger a governance-mapping task due within 30 days of activation, and the policy is reviewed at least annually. Credit-parameter and pricing-configuration changes are write-restricted to authorized roles; all changes route through approval before activation.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | New lending product or partner program activated (`lending_program.activated`) | Program identity (`lending_program.id`), channel (`lending_program.channel`), partner (`lending_program.partner_id`) | Governance map entry + emitted `lending_program.governance_mapped` | 30 days (enforced by `lending_program.governance_due_at`) |
  | Credit-config or pricing-parameter change requested (`credit_config.change_requested`) | Proposed diff (`credit_config.diff`), approver (`credit_config.approval_id`) | Approved/rejected config change + emitted `credit_config.changed` | Internal: 5 BD |
  | Annual policy review cycle opens (`policy.review_due`) | Policy document (`policy.document_id`), version (`policy.document_version`) | Reviewed/approved policy + emitted `policy.review_completed` | Annual (enforced by `policy.next_review_at`) |

- **ALERTS/METRICS:** Alert on governance-mapping tasks aging past 30 days (`lending_program.governance_due_at`) and on policy review approaching lapse (`policy.review_warning_at`); target zero unmapped active programs.

## LN-02 — Product Eligibility & Prohibited Practices  {#ln-02-product-eligibility-prohibited-practices}

- **WHY (Reg cite):** Maintaining a defined, neutral credit box and blocking abusive/prohibited products supports safe-and-sound underwriting under NCUA expectations ([NCUA Part 701](https://www.ecfr.gov/current/title-12/part-701)) and the nondiscriminatory evaluation standard of ECOA/Reg B ([12 CFR §1002.6](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6)).
- **SYSTEM BEHAVIOR:** A machine-readable "credit box" per product (collateral, LTV, terms) is maintained and reviewed at least annually. Applications for explicitly prohibited products (payday, vehicle-title, tax RALs, defined private education loans, stated-income/no-doc) are screened and blocked at intake. The credit-box definition is write-restricted to authorized credit-policy roles.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Application screened against product rules (`loan_application.product_screened`) | Product code (`loan_application.product_code`), product type (`loan_application.product_type`), credit-box definition (`credit_box.definition`) | Screen result (pass/blocked) + emitted `loan_application.product_screened` | Internal: at intake |
  | Annual credit-box review opens (`credit_box.review_due`) | Credit-box version (`credit_box.version`), definition (`credit_box.definition`) | Reviewed credit box + emitted `credit_box.review_completed` | Annual (enforced by `credit_box.next_review_at`) |

- **ALERTS/METRICS:** Target zero prohibited-product applications progressing past intake; alert on credit-box review aging past its annual due date (`credit_box.review_due`).

## LN-03 — Applications, Acceptance & Denial Standards  {#ln-03-applications-acceptance-denial-standards}

- **WHY (Reg cite):** ECOA/Reg B requires evaluation on neutral creditworthiness factors and decisions on completed applications within 30 days ([12 CFR §1002.6](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6); [§1002.9](https://www.ecfr.gov/current/title-12/part-1002#p-1002.9)); inquiry/application rules anchor the standardized intake ([§1002.5](https://www.ecfr.gov/current/title-12/part-1002#p-1002.5)).
- **SYSTEM BEHAVIOR:** A standardized underwriting bundle (application data, credit, income/assets, DTI, collateral/LTV, OFAC, ATR/QM) is required and summarized into a CAR-equivalent object before decision; decisions are based on neutral factors only. Completed applications are decided within 30 days; incompleteness notices issue when the application is not complete. The decision basis (`loan_application.action_basis`) is write-restricted to underwriting and Compliance roles.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Application becomes complete (`loan_application.completed`) | Application data (`loan_application.data`), income/assets (`loan_application.income_assets`), DTI (`loan_application.dti`), credit structure (`loan_application.credit_structure`) | Sealed CAR object + emitted `car.sealed` | Internal: pre-decision |
  | Application decisioned (`loan_application.decisioned`) | Decision (`loan_application.decision`), action basis (`loan_application.action_basis`), final action (`loan_application.final_action`) | Recorded decision + emitted `application.final_action_recorded` | 30 days (enforced by `loan_application.decision_due_at`) |
  | Application detected incomplete (`loan_application.incomplete_detected`) | Incompleteness flag (`loan_application.incomplete_aged`), missing items | Incompleteness notice + emitted `loan_application.incompleteness_notice_sent` | 30 days (enforced by `application.notice_due_at`) |

- **ALERTS/METRICS:** Alert when undecided completed applications approach the 30-day deadline (`loan_application.decision_due_at`); monitor decision-latency distribution and target zero past-due decisions.

## LN-04 — Credit Scoring & Adverse Credit History  {#ln-04-credit-scoring-adverse-credit-history}

- **WHY (Reg cite):** Empirically derived, demonstrably sound scoring and consistent treatment of derogatory credit support nondiscriminatory evaluation under ECOA/Reg B ([12 CFR §1002.2(p)](https://www.ecfr.gov/current/title-12/part-1002#p-1002.2); [§1002.6](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6)); credit-report currency and score disclosure tie to FCRA ([15 USC §1681m](https://www.law.cornell.edu/uscode/text/15/1681m)).
- **SYSTEM BEHAVIOR:** Empirically derived scores act as a secondary check, not the sole driver; configurable FICO bands and derogatory-credit tolerances (bankruptcy seasoning, small medical judgments) route exceptions for review. Credit reports must be no older than 6 months at decision; thin-file borrowers are supported with alternative credit data. FICO bands and seasoning rules (`credit_config.fico_bands`, `credit_config.seasoning_rules`) are write-restricted to authorized credit-policy roles.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Credit report received (`credit_report.received`) | Report date (`credit_report.report_date`), score disclosure (`credit_report.score_disclosure`) | Freshness-checked report + emitted `credit_report.freshness_checked` | Report ≤6 months at decision (enforced by `credit_report.stale_at`) |
  | Derogatory tolerance breached (`credit_score.tolerance_breached`) | Score bands (`credit_config.fico_bands`), seasoning rules (`credit_config.seasoning_rules`) | Exception case routed + emitted `loan_exception.detected` | Internal: pre-decision |
  | Thin-file applicant identified (`loan_application.thin_file_flagged`) | Application data (`loan_application.data`), alternative-data inputs | Alternative-data record used + emitted `car.alternative_data_used` | Internal: pre-decision |

- **ALERTS/METRICS:** Alert on decisions attempted with stale credit reports (`credit_report.stale_at`); monitor exception-routing volume by reason code and target zero score-only denials.

## LN-05 — ATR/QM & Mortgage Underwriting  {#ln-05-atr-qm-mortgage-underwriting}

- **WHY (Reg cite):** TILA/Reg Z requires the ability-to-repay determination and QM classification for covered closed-end 1–4 family dwelling-secured consumer credit before consummation ([12 CFR §1026.43](https://www.ecfr.gov/current/title-12/part-1026#p-1026.43)).
- **SYSTEM BEHAVIOR:** For covered closed-end 1–4 family dwelling-secured loans, the 8-factor ATR checklist and QM classification are required, with a 43% consumer DTI default and capacity for stricter configurable tiers (e.g., 35% mortgage). The ATR checklist must complete before docs print; documents are blocked until ATR/QM is recorded. DTI tier configuration (`credit_config.dti_tiers`) is write-restricted to authorized credit-policy roles.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Docs requested on covered loan (`loan_application.docs_requested`) | ATR/QM result (`loan_application.atr_qm_result`), DTI (`loan_application.dti`), DTI tiers (`credit_config.dti_tiers`) | ATR/QM determination + emitted `loan_application.atr_qm_completed` | Before docs print (enforced by `loan_application.doc_block_state`) |
  | DTI threshold breached (`loan_application.dti_breached`) | DTI (`loan_application.dti`), configured tier (`credit_config.dti_tiers`) | Exception case routed + emitted `loan_exception.detected` | Internal: pre-docs |

- **ALERTS/METRICS:** Target zero covered loans reaching doc-print without a recorded ATR/QM result; monitor QM-vs-non-QM classification mix and DTI-breach exception rate.

## LN-06 — Appraisals, Valuations & Collateral  {#ln-06-appraisals-valuations-collateral}

- **WHY (Reg cite):** ECOA/Reg B requires free, prompt delivery of appraisals and valuations for first-lien dwelling-secured credit ([12 CFR §1002.14](https://www.ecfr.gov/current/title-12/part-1002#p-1002.14)); appraisal independence and anti-redlining tie to FHA and NCUA ([42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605); [12 CFR §701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31)).
- **SYSTEM BEHAVIOR:** Appraisal independence and an approved-appraiser list are enforced; free appraisal copies for first-lien dwellings are auto-generated and promptly delivered, with copies retained ≥25 months. Configurable product LTV matrices are enforced at decision. A bias-screen ruleset is applied to valuations, and applicants may request a reconsideration of value (ROV). The appraiser list and LTV matrix (`credit_config.ltv_matrix`) are write-restricted to authorized roles.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | First-lien dwelling application created (`application.first_lien_created`) | Property address (`property.address`), appraisal order | Appraisal ordered + emitted `appraisal.ordered` | Internal: at intake |
  | Appraisal completed (`appraisal.completed`) | Appraisal document (`appraisal.document`), value (`appraisal.value`), applicant contact (`applicant.contact`) | Appraisal copy delivered + emitted `appraisal.copy_delivered` | Promptly / ≥3 BD before consummation (enforced by `appraisal.delivery_due_at`) |
  | Collateral LTV checked at decision (`collateral.ltv_checked`) | LTV (`loan.ltv`), LTV matrix (`credit_config.ltv_matrix`) | LTV check result + emitted `collateral.ltv_checked` | Internal: pre-decision |
  | Reconsideration of value requested (`valuation.rov_requested`) | Valuation report (`valuation.report`), bias-screen rules (`valuation.bias_screen_rules`) | ROV decision + emitted `valuation.rov_decided` | Enforced by `valuation.rov_due_at` |

- **ALERTS/METRICS:** Alert on appraisal-copy delivery aging past `appraisal.delivery_due_at`; monitor ROV turnaround and target zero LTV-matrix overrides without exception approval.

## LN-07 — Adverse Action & Notifications  {#ln-07-adverse-action-notifications}

- **WHY (Reg cite):** ECOA/Reg B governs adverse-action content and timing (30 days for completed applications and existing-account adverse action; 90 days post-counteroffer if not accepted) ([12 CFR §1002.9](https://www.ecfr.gov/current/title-12/part-1002#p-1002.9)); FCRA governs credit-report/score-based content ([15 USC §1681m / §615(a)](https://www.law.cornell.edu/uscode/text/15/1681m)).
- **SYSTEM BEHAVIOR:** ECOA/Reg B and FCRA adverse-action content and timing are enforced; an AAN with specific reasons and the ECOA notice issues for adverse decisions. All denials require second-level review for consistency and fair-lending concerns before the notice is issued. A counteroffer that is accepted within its window requires no AAN; an unaccepted counteroffer triggers a 90-day AAN clock. The action basis (`loan_application.action_basis`) is write-restricted to underwriting and Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Application decided adversely (`loan_application.adverse_action_decided`) | Applicant identity (`loan_party.identity`), action basis (`loan_application.action_basis`), reason codes | Queued AAN pending second review + emitted `aan.queued` | — |
  | Second-level denial review completed (`aan.second_review_completed`) | Decision (`loan_application.decision`), action basis (`loan_application.action_basis`) | AAN with specific reasons + ECOA notice (`aan.issued`) | 30 days (enforced by `loan_application.aan_due_at`) |
  | Counteroffer issued and not accepted (`loan_application.counteroffer_expired`) | Counteroffer terms (`loan_application.counteroffer_terms`), counteroffer status (`loan_application.counteroffer_status`) | AAN issued on counteroffer + emitted `aan.issued` | 90 days (enforced by `loan_application.counteroffer_aan_due_at`) |
  | Oral adverse decision recorded (`loan_application.oral_adverse_decision`) | Oral statement (`loan_application.oral_statement`), action basis (`loan_application.action_basis`) | Logged oral notice + emitted `notice.oral_logged` | 30 days (enforced by `loan_application.aan_due_at`) |

- **ALERTS/METRICS:** Alert when queued AANs approach `loan_application.aan_due_at` and on counteroffer clocks nearing `loan_application.counteroffer_aan_due_at`; target zero denials issued without recorded second-level review.

## LN-08 — Exceptions, Mitigating Factors & Overrides  {#ln-08-exceptions-mitigating-factors-overrides}

- **WHY (Reg cite):** Consistent, documented exception handling guards against disparate treatment under ECOA/Reg B ([12 CFR §1002.6](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6)) and supports safe-and-sound underwriting under NCUA expectations ([NCUA Part 701](https://www.ecfr.gov/current/title-12/part-701)).
- **SYSTEM BEHAVIOR:** Breaches of numeric/qualitative rules (DTI, FICO, LTV, bankruptcy seasoning, product restrictions) are detected automatically; standardized mitigant selection and approval routing are required, and exceptions are decided before closing (closing is blocked until decided). Portfolio-level exception analytics are produced. Override rationale and senior approval are recorded; override approval is write-restricted to senior-approver roles.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Rule breach detected (`loan_exception.detected`) | Breached rule (`loan_exception.rule`), observed value (`loan_exception.observed_value`) | Exception case opened + emitted `loan_exception.case_opened` | Internal: pre-closing (enforced by `loan_exception.closing_block_state`) |
  | Exception submitted with mitigants (`loan_exception.submitted`) | Approval tier (`loan_exception.approval_tier`), mitigant selection | Exception decision + emitted `loan_exception.decided` | Before closing |
  | Override invoked on a decision (`override.recorded`) | Rationale (`override.rationale`), senior approver (`override.senior_approver_id`) | Senior override decision + emitted `override.senior_decision_recorded` | Enforced by `override.escalation_timer` |
  | Exception analytics cycle due (`loan_exception.analytics_due`) | Exception register, demographics summary | Portfolio exception analytics + emitted `loan_exception.analytics_published` | Enforced by `loan_exception.analytics_due` |

- **ALERTS/METRICS:** Alert on exception cases reaching closing-block state without decision; monitor exception and override rates by product, channel, and partner with fair-lending disparity flags.

## LN-09 — Documentation, Recordkeeping & Retention  {#ln-09-documentation-recordkeeping-retention}

- **WHY (Reg cite):** ECOA/Reg B requires retention of applications, evaluation data, GMI, and adverse-action notices for the prescribed period ([12 CFR §1002.12](https://www.ecfr.gov/current/title-12/part-1002#p-1002.12)); HMDA recordkeeping applies to covered dwelling-secured credit ([12 CFR §1003.5](https://www.ecfr.gov/current/title-12/part-1003#p-1003.5)).
- **SYSTEM BEHAVIOR:** A credit-package schema is enforced for every loan and prequalification; all required documents must be present before booking (booking is blocked until complete). Retention of ≥25 months applies to applications, GMI, evaluation data, and AA notices (longer per CU standard). Document disposition and credit-package retention are managed via registered retention tasks; the credit-package schema is write-restricted to authorized roles.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Required document set established (`document.required_set`) | Document type (`document.type`), subject ref (`document.subject_ref`) | Recorded required-document set + emitted `document.required_set` | Before booking (enforced by `document.attachment_due_at`) |
  | Loan booking requested (`loan.booking_requested`) | Credit-package schema (`credit_package.schema`), document completeness | Validated credit package + emitted `credit_package.validated` | Internal: pre-booking |
  | Credit-package retention begins at booking (`credit_package.retention_started`) | Retention class (`record.retention_class`), anchor (`record.retention_anchor`) | Retention clock set + emitted `record.retention_clock_set` | ≥25 months (enforced by `credit_package.retention_expires_at`) |

- **ALERTS/METRICS:** Target zero loans booked with incomplete document sets (`document.attachment_due_at`); alert on retention records approaching purge eligibility under legal hold.

## LN-10 — Pricing, Rate Sheets & HPML Controls  {#ln-10-pricing-rate-sheets-hpml-controls}

- **WHY (Reg cite):** TILA/Reg Z governs HPML escrow/appraisal triggers and points-and-fees tests for covered mortgages ([12 CFR §1026.35](https://www.ecfr.gov/current/title-12/part-1026#p-1026.35); [§1026.43](https://www.ecfr.gov/current/title-12/part-1026#p-1026.43)) and loan-originator compensation/anti-steering ([§1026.36(d),(e)](https://www.ecfr.gov/current/title-12/part-1026#p-1026.36)); pricing neutrality ties to ECOA/Reg B ([12 CFR §1002.6](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6)).
- **SYSTEM BEHAVIOR:** Weekly APOR-tied rate sheets are maintained; HPML and points-and-fees tests run on covered mortgages before docs print. A pricing-exception workflow with mitigants and approvals is enforced across direct and partner pricing engines. LO compensation plans are reviewed for anti-steering compliance. Rate-sheet APOR values and pricing parameters are write-restricted to authorized pricing roles.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Weekly rate-sheet refresh due (`rate_sheet.refresh_due_at`) | APOR values (`rate_sheet.apor_values`) | Published rate sheet + emitted `rate_sheet.apor_published` | Weekly (enforced by `rate_sheet.refresh_due_at`) |
  | Pricing locked on covered mortgage (`loan_pricing.locked`) | APR (`loan_pricing.apr`), points and fees (`loan_pricing.points_fees`), APOR (`rate_sheet.apor_values`) | HPML test result + emitted `loan_pricing.hpml_tested` | Before docs print |
  | Pricing exception requested (`pricing.exception_requested`) | Sheet price (`pricing.sheet_price`), proposed price (`pricing.proposed_price`), rationale (`pricing.exception_rationale`) | Pricing-exception decision + emitted `pricing.exception_decided` | Enforced by `pricing.exception_review_due_at` |
  | LO comp plan submitted (`lo_comp.plan_submitted`) | Plan terms (`lo_comp.plan_terms`), basis analysis (`lo_comp.basis_analysis`) | LO comp decision + emitted `lo_comp.plan_decided` | Internal: pre-launch |

- **ALERTS/METRICS:** Alert on stale rate sheets past weekly refresh (`rate_sheet.refresh_due_at`) and on covered mortgages reaching docs without an HPML test; monitor pricing-exception demographics for disparity.

## LN-11 — OFAC & Sanctions Gate  {#ln-11-ofac-sanctions-gate}

- **WHY (Reg cite):** OFAC sanctions regulations require screening of obligors and clearance before funds move ([31 CFR Chapter V](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-V); FFIEC BSA/AML Manual). This control covers only the lending OFAC gate; broader BSA/AML program governance is out of scope.
- **SYSTEM BEHAVIOR:** All new borrowers, co-borrowers, and guarantors are screened before closing, with clearance required before funding (funding is blocked until cleared). Apparent-match cases escalate for disposition, and override rationale is captured when a match is cleared. OFAC status and override rationale are write-restricted to BSA/Compliance roles.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Loan party screened (`loan_party.ofac_screened`) | Party identity (`loan_party.identity`), list version (`ofac.list_version`) | Screen result + emitted `loan_party.ofac_screened` | Before closing |
  | Apparent match escalated (`loan_party.ofac_escalated`) | Potential-match flag (`loan_party.ofac_potential_match`), match result (`loan_party.ofac_result`) | Escalated OFAC case + emitted `loan_party.ofac_escalated` | Before funding |
  | Match cleared with rationale (`loan_party.ofac_cleared`) | OFAC status (`loan_party.ofac_status`), hotline record (`ofac.hotline_record`) | Clearance with override rationale + emitted `loan_party.ofac_cleared` | Before funding (enforced by `loan.funding_block_state`) |

- **ALERTS/METRICS:** Target zero loans funded without OFAC clearance (`loan.funding_block_state`); alert on aging unresolved apparent-match escalations.

## LN-12 — Prequalification, Marketing & Steering Controls  {#ln-12-prequalification-marketing-steering-controls}

- **WHY (Reg cite):** ECOA/Reg B prohibits discouragement and prohibited-basis discrimination in inquiries and prescreening ([12 CFR §1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4); [§1002.5](https://www.ecfr.gov/current/title-12/part-1002#p-1002.5)); Reg Z anti-steering and advertising rules ([12 CFR §1026.36(e)](https://www.ecfr.gov/current/title-12/part-1026#p-1026.36); [§1026.24](https://www.ecfr.gov/current/title-12/part-1026#p-1026.24)); FHA prohibits steering in dwelling-secured credit ([42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605)).
- **SYSTEM BEHAVIOR:** Prequalification is based on neutral, documented criteria; steering into less favorable products by prohibited bases or proxies is prohibited. Online and partner product menus are reviewed to ensure they do not discourage protected groups. Steering reviews run on a recurring cadence, and discouragement findings are reported. Prequalification criteria and product-menu configurations are write-restricted to authorized roles.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Prequalification requested (`prequal.requested`) | Criteria version (`prequal.criteria_version`), inputs (`prequal.inputs`), product mapping (`prequal.product_mapping`) | Prequal decision + emitted `prequal.decided` | Internal: at request |
  | Product-menu change deployed (`product_menu.change_requested`) | Menu diff (`product_menu.diff`), steering review (`product_menu.steering_review`) | Deployed menu + emitted `product_menu.deployed` | Internal: pre-deploy |
  | Steering review cycle due (`steering_review.due`) | Outcome metrics (`product_menu.outcome_metrics`) | Completed steering review + emitted `steering_review.completed` | Enforced by `steering_review.due` |
  | Discouragement identified (`fair_lending.discouragement_reported`) | Assessment area (`analytics.assessment_area`), finding | Discouragement report + emitted `fair_lending.discouragement_reported` | Internal: on detection |

- **ALERTS/METRICS:** Alert on overdue steering reviews (`steering_review.due`); monitor product-placement outcome distributions by protected-class proxy and target zero unreviewed menu deployments.

## LN-13 — Fair Lending Risk Assessment & Monitoring  {#ln-13-fair-lending-risk-assessment-monitoring}

- **WHY (Reg cite):** ECOA/Reg B requires GMI collection for covered dwelling-secured applications and supports monitoring for disparate treatment/impact ([12 CFR §1002.13](https://www.ecfr.gov/current/title-12/part-1002#p-1002.13)); FHA and NCUA anti-redlining ([42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605); [12 CFR §701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31)); HMDA data collection ([12 CFR §1003.5](https://www.ecfr.gov/current/title-12/part-1003#p-1003.5)).
- **SYSTEM BEHAVIOR:** Reproducible application, approval, denial, pricing, and loss data with GMI is maintained by product, channel, partner, and geography. A full fair-lending risk assessment runs at least annually, and remediation is tracked to closure. GMI is collected at application; disparity and redlining analyses run on cadence. Analytics datasets and GMI records are write-restricted to Compliance/analytics roles. Detailed analytics methodology is governed by the separate Fair Lending Policy.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | GMI recorded at application (`hmda.gmi_recorded`) | GMI responses (`applicant.gmi_responses`), application GMI (`loan_application.gmi`) | Recorded GMI + emitted `hmda.gmi_recorded` | Internal: at application |
  | Annual fair-lending assessment due (`fair_lending.assessment_due`) | Lending dataset (`analytics.lending_dataset`), dataset version (`fair_lending.dataset_version`) | Completed assessment + emitted `fair_lending.assessment_completed` | Annual (enforced by `fair_lending.next_assessment_at`) |
  | Disparity threshold breached (`analytics.threshold_breached`) | Cohort threshold (`analytics.cohort_threshold`), breach detail (`analytics.breach_detail`) | Remediation opened + emitted `fair_lending.remediation_opened` | Enforced by `analytics.disparity_due_at` |
  | Remediation completed (`fair_lending.remediation_closed`) | Finding (`fair_lending.finding_id`), remediation evidence | Remediation closure + emitted `fair_lending.remediation_closed` | Enforced by `fair_lending.remediation_due_at` |

- **ALERTS/METRICS:** Alert on annual assessment approaching its due date (`fair_lending.assessment_due`) and on open remediation aging past `fair_lending.remediation_due_at`; monitor approval/denial/pricing disparity indices by product, channel, partner, and geography.

## LN-14 — Insider Lending & Employee Conflicts  {#ln-14-insider-lending-employee-conflicts}

- **WHY (Reg cite):** NCUA insider-practice and safety-and-soundness expectations prohibit preferential insider terms and require reporting ([NCUA Part 701](https://www.ecfr.gov/current/title-12/part-701); [12 CFR §701.21](https://www.ecfr.gov/current/title-12/part-701/section-701.21)); neutral treatment also anchors to ECOA/Reg B ([12 CFR §1002.6](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6)).
- **SYSTEM BEHAVIOR:** A no-preferential-terms posture applies to employees, officers, directors, and related parties; insider flags are tagged and resolved before decision (decision is blocked until resolved). Looser underwriting or pricing is never applied to insiders, enforced by terms-parity checks against comparable non-insider terms. Insider/employee lending activity is reported to governance. Insider flags and parity determinations are write-restricted to Compliance and board-governance roles.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Insider screened on application (`loan_application.insider_screened`) | Application parties (`loan_application.parties`), insider status | Insider screen result + emitted `loan_application.insider_screened` | Internal: pre-decision |
  | Insider flagged (`loan_application.insider_flagged`) | Proposed terms (`insider.proposed_terms`), comparable terms (`insider.comparable_terms`) | Insider case + emitted `insider.terms_parity_checked` | Before decision (enforced by `loan_application.decision_block_state`) |
  | Insider case resolved (`insider_case.resolved`) | Parity result (`insider.funded_terms`), attestation (`insider_case.attestation`) | Resolved insider case + emitted `insider_case.resolved` | Before decision |
  | Insider lending report due (`insider_report.due`) | Aggregate credit (`insider.aggregate_credit_amount`), record entry (`insider.record_entry`) | Board insider report + emitted `insider.board_report_issued` | Enforced by `insider_report.due` |

- **ALERTS/METRICS:** Target zero insider decisions made with an unresolved insider flag (`loan_application.decision_block_state`); alert on insider credit-limit thresholds exceeded and on overdue insider governance reports.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer (serving as Fair Lending Officer).
- **Approvers:** Patrick Wilson, Chief Compliance Officer.
- **Required participants:** Chief Lending Officer, Loan Operations, Underwriting, BSA/Compliance, and the Board (or Lending/Fair Lending Committee) as required.
- **Review cadence:** At least annually; governance mapping updated within 30 days of any new product or program (see [LN-01](#ln-01-governance-roles-program-scope)).
- **Cross-references:** Collections Policy (delinquency/charge-off workflow); BSA Policy (BSA/AML governance beyond the lending OFAC gate); Fair Lending Policy (program governance and analytics methodology); Member and BSA Policies (eligibility, onboarding, CIP); Truth-in-Savings Policy; Record Retention Policy (general schedules); Third-Party Risk Policy (fintech/BaaS onboarding and vendor due diligence).

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** Several lending-side field, event, and timer codes referenced in the control overlays are drawn from the parsed core vocabulary and the agreed "Provisional codes" list; some (e.g., `property.address`, `credit_report.score`, `loan_party.identity` sub-fields) are provisional spellings or near-matches and will be confirmed by engineering before the next review. No needed code was omitted; codes coined or selected provisionally are covered collectively here.
- **Charter type and NCUA applicability.** Pynthia is treated as a federally insured credit union, making NCUA Parts 701/741/748 and §701.31 applicable; confirm exact charter and whether §701.21 insider-lending provisions or other agency rules govern.
- **HMDA reporter status.** Controls assume Pynthia is (or may become) a HMDA reporter and collects GMI for covered dwelling-secured applications; confirm reporter status and LAR submission obligations, which would activate `hmda.submission_due_at` / `hmda.lar_qc_due_at` workflows not fully detailed here.
- **Appraisal-copy delivery timing.** ECOA §1002.14 requires "promptly upon completion" or no later than three business days before consummation; the "≥3 BD before consummation" figure in the Timing Matrix assumes the consummation-anchored deadline applies — confirm the operative trigger per product.
- **BaaS/partner pricing-engine reach.** Controls assume the pricing-exception and HPML workflows extend to partner and white-label pricing engines via the same event surface; confirm integration coverage with each partner program.
- **Derogatory-credit tolerances and DTI tiers.** Specific bankruptcy-seasoning windows, medical-judgment thresholds, and the 35% mortgage tier are illustrative defaults from PATRICK_NOTES; confirm the final configured values in `credit_config`.
- **Retention period.** A ≥25-month retention floor is applied per ECOA §1002.12; the CU's longer standard retention period should be confirmed and set as the governing `record.retention_class` schedule.
