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

# Lending Policy

## General Policy Statement

Pynthia Credit Union extends credit on a safe-and-sound, non-discriminatory basis: every acceptance and denial decision rests solely on neutral, documented creditworthiness factors, never on a prohibited basis under [ECOA/Reg B](https://www.ecfr.gov/current/title-12/part-1002) or the [Fair Housing Act](https://www.law.cornell.edu/uscode/text/42/3605). This policy covers all credit products and channels — direct, fintech-partner, and white-label/BaaS programs — and doubles as the design specification for Pynthia's lending systems and partner integrations. Steering, discriminatory product placement, and preferential insider loans are prohibited. Collections workflow, BSA/AML program governance beyond the lending OFAC gate, fair-lending analytics methodology, member onboarding/CIP, Truth-in-Savings disclosures, general record-retention schedules, and partner vendor due diligence are governed by their respective policies.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Decision on a completed application | Application reaches completed status (`loan_application.completed`) | 30 days | Reg B [§1002.9(a)(1)(i)](https://www.ecfr.gov/current/title-12/part-1002#p-1002.9(a)(1)(i)) | [LN-03](#ln-03-applications-acceptance--denial-standards) |
| Adverse-action notice — completed application | Adverse decision recorded (`loan_application.adverse_action_decided`) | 30 days | Reg B [§1002.9(a)(1)(i)](https://www.ecfr.gov/current/title-12/part-1002#p-1002.9(a)(1)(i)); FCRA [§1681m](https://www.law.cornell.edu/uscode/text/15/1681m) | [LN-07](#ln-07-adverse-action--notifications) |
| Adverse action on an existing account | Account action taken (`loan_account.adverse_action_decided`) | 30 days | Reg B [§1002.9(a)(1)(ii)](https://www.ecfr.gov/current/title-12/part-1002#p-1002.9(a)(1)(ii)) | [LN-07](#ln-07-adverse-action--notifications) |
| Counteroffer not accepted | Counteroffer issued, no acceptance (`loan_application.counteroffer_expired`) | 90 days from notification | Reg B [§1002.9(a)(1)(iv)](https://www.ecfr.gov/current/title-12/part-1002#p-1002.9(a)(1)(iv)) | [LN-07](#ln-07-adverse-action--notifications) |
| Appraisal copy delivery — first-lien dwelling | Appraisal/valuation completed (`appraisal.completed`) | Promptly; ≤ 3 business days before consummation | Reg B [§1002.14(a)(1)](https://www.ecfr.gov/current/title-12/part-1002#p-1002.14(a)(1)) | [LN-06](#ln-06-appraisals-valuations--collateral) |
| ATR checklist + QM classification | Mortgage file ready for docs (`loan_application.docs_requested`) | Before closing documents print | Reg Z [§1026.43(c)](https://www.ecfr.gov/current/title-12/part-1026#p-1026.43(c)) | [LN-05](#ln-05-atrqm--mortgage-underwriting) |
| HPML and points-and-fees tests | Mortgage pricing locked (`loan_pricing.locked`) | Before closing documents print | Reg Z [§1026.35](https://www.ecfr.gov/current/title-12/part-1026#p-1026.35), [§1026.43(e)(3)](https://www.ecfr.gov/current/title-12/part-1026#p-1026.43(e)(3)) | [LN-10](#ln-10-pricing-rate-sheets--hpml-controls) |
| OFAC clearance | Borrower/co-borrower/guarantor added (`loan_party.added`) | Before closing; clearance before funding | [31 CFR Ch. V](https://www.ecfr.gov/current/title-31/chapter-V) | [LN-11](#ln-11-ofac--sanctions-gate) |
| Exception decision | Rule breach detected (`loan_exception.detected`) | Before closing | Internal standard | [LN-08](#ln-08-exceptions-mitigating-factors--overrides) |
| Records retention — applications, GMI, evaluation data, AA notices | Final action taken (`loan_application.final_action`) | Retain ≥ 25 months | Reg B [§1002.12(b)](https://www.ecfr.gov/current/title-12/part-1002#p-1002.12(b)) | [LN-09](#ln-09-documentation-recordkeeping--retention) |
| Rate-sheet refresh | Weekly APOR publication (`rate_sheet.apor_published`) | Weekly | Reg Z [§1026.35(a)(2)](https://www.ecfr.gov/current/title-12/part-1026#p-1026.35(a)(2)) | [LN-10](#ln-10-pricing-rate-sheets--hpml-controls) |
| Governance mapping after new product/program | Product or program activated (`lending_program.activated`) | 30 days | Internal standard | [LN-01](#ln-01-governance-roles--program-scope) |
| Fair-lending risk assessment | Annual cycle start (`fair_lending.assessment_due`) | Annually | NCUA [§701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31); Reg C [Part 1003](https://www.ecfr.gov/current/title-12/part-1003) | [LN-13](#ln-13-fair-lending-risk-assessment--monitoring) |
| Credit box review | Annual cycle start (`credit_box.review_due`) | Annually | Internal standard | [LN-02](#ln-02-product-eligibility--prohibited-practices) |

## LN-01 — Governance, Roles & Program Scope  {#ln-01-governance-roles--program-scope}

- **WHY (Reg cite):** NCUA safety-and-soundness and nondiscrimination expectations ([12 CFR §701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31); [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741)) require lending programs to operate under documented governance with accountable owners; Reg B ([12 CFR §1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4)) makes the credit union responsible for nondiscrimination across every channel it controls, including partner programs.
- **SYSTEM BEHAVIOR:** Every lending and fair-lending control in this policy is mapped to a named owner in a governance registry. Every product and program — including each BaaS/white-label partner program — carries scope flags identifying which controls, regulations, and reporting obligations apply. When a new product or program is activated, the governance mapping is updated within 30 days. The policy itself is reviewed at least annually. Credit-parameter and pricing-configuration changes (credit box, FICO bands, DTI tiers, LTV matrices, rate sheets) are write-restricted to authorized Compliance and Lending administrator roles; all other roles are read-only.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | New product or partner program activated (`lending_program.activated`) | Program identity (`lending_program.id`), product set (`lending_program.products[]`), channel (`lending_program.channel`), partner reference (`lending_program.partner_id`) | Updated governance map with control owners and scope flags (`lending_program.governance_mapped`) | 30 days (enforced by `lending_program.governance_due_at`) |
  | Credit parameter or pricing configuration changed (`credit_config.change_requested`) | Requestor role (`user.role`), parameter diff (`credit_config.diff`), approval record (`credit_config.approval_id`) | Versioned configuration with approver identity (`credit_config.changed`) | Before the change takes effect |
  | Annual policy review cycle opens (`policy.review_due`) | Current policy version (`policy.version`), prior-year exam and audit findings (`policy.findings[]`) | Reviewed and approved policy version (`policy.review_completed`) | 12 months from last approval (enforced by `policy.next_review_at`) |

- **ALERTS/METRICS:** Alert when a program passes 30 days post-activation without governance mapping (target zero); count of unauthorized credit-config change attempts blocked (target zero); days since last policy review trended against the 12-month ceiling.

## LN-02 — Product Eligibility & Prohibited Practices  {#ln-02-product-eligibility--prohibited-practices}

- **WHY (Reg cite):** Safe-and-sound lending under [NCUA Part 741](https://www.ecfr.gov/current/title-12/part-741) requires written product standards; restricting credit to defined products with documented terms also limits fair-lending exposure under Reg B ([§1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4)).
- **SYSTEM BEHAVIOR:** Each approved product carries a machine-readable "credit box" defining permitted collateral types, maximum LTV, term ranges, amount ranges, and rate parameters. The application intake layer rejects, at submission, any application for a prohibited product: payday loans, vehicle-title loans, tax refund anticipation loans, defined private education loans, and stated-income/no-doc loans. The credit box is reviewed at least annually. Credit-box definitions are write-restricted to authorized Compliance and Lending administrator roles per [LN-01](#ln-01-governance-roles--program-scope).
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Application submitted for any product (`loan_application.created`) | Product code (`loan_application.product_code`), requested terms (`loan_application.requested_terms`), credit-box definition (`credit_box.definition`) | Eligibility result; prohibited products blocked at intake (`loan_application.product_screened`) | At submission, real time |
  | Credit box annual review opens (`credit_box.review_due`) | Current credit-box versions (`credit_box.version`), portfolio performance data (`portfolio.performance_metrics`) | Re-approved or revised credit box (`credit_box.review_completed`) | 12 months from last review (enforced by `credit_box.next_review_at`) |

- **ALERTS/METRICS:** Count of prohibited-product applications blocked, trended for channel/partner anomalies; alert when any credit box exceeds 12 months without review (target zero); count of applications booked outside credit-box parameters without an exception record (target zero).

## LN-03 — Applications, Acceptance & Denial Standards  {#ln-03-applications-acceptance--denial-standards}

- **WHY (Reg cite):** Reg B requires creditors to evaluate applications without regard to a prohibited basis ([§1002.6](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6)), to handle inquiries and applications consistently ([§1002.5](https://www.ecfr.gov/current/title-12/part-1002#p-1002.5)), and to notify applicants of action taken within 30 days of a completed application ([§1002.9(a)(1)](https://www.ecfr.gov/current/title-12/part-1002#p-1002.9(a)(1))).
- **SYSTEM BEHAVIOR:** Every application is decisioned from a standardized underwriting bundle — application data, credit report, income/asset verification, DTI computation, collateral/LTV where applicable, OFAC screen, and ATR/QM analysis where applicable — summarized into a Credit Approval Record (CAR-equivalent) object. Decisions use only the neutral creditworthiness factors defined in the credit box and underwriting standards; prohibited-basis fields and proxies are excluded from decision logic. Completed applications are decided within 30 days. An application missing required bundle elements is flagged incomplete and routed for a notice of incompleteness rather than silently aged. The CAR object is immutable after final action; corrections create a new version with the original preserved.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Application reaches completed status (`loan_application.completed`) | Underwriting bundle: application data (`loan_application.data`), credit report (`credit_report.id`), income/assets (`loan_application.income_assets`), DTI (`loan_application.dti`), collateral/LTV (`collateral.ltv`), OFAC result (`loan_party.ofac_status`), ATR/QM result (`loan_application.atr_qm_result`) | CAR object and decision (`loan_application.decisioned`) | 30 days (internal: 10 BD; enforced by `loan_application.decision_due_at`) |
  | Bundle element missing at underwriting (`loan_application.incomplete_detected`) | List of missing items (`loan_application.missing_items[]`) | Notice of incompleteness issued (`loan_application.incompleteness_notice_sent`) | 30 days from application |
  | Decision finalized (`loan_application.decisioned`) | CAR object (`car.id`), decision basis factors (`car.decision_basis[]`) | Immutable CAR version sealed (`car.sealed`) | At decision, real time |

- **ALERTS/METRICS:** Aging alert on applications approaching the 30-day decision deadline (warn at 20 days, escalate at 25); decision-latency distribution by product, channel, and partner; count of decisions sealed without a complete bundle (target zero).

## LN-04 — Credit Scoring & Adverse Credit History  {#ln-04-credit-scoring--adverse-credit-history}

- **WHY (Reg cite):** Reg B permits empirically derived, demonstrably and statistically sound credit scoring systems and constrains how factors such as age may be treated ([§1002.6(b)](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6(b))); FCRA governs use of consumer reports and scores in credit decisions ([15 USC §1681m](https://www.law.cornell.edu/uscode/text/15/1681m)).
- **SYSTEM BEHAVIOR:** Credit scores act as a secondary check, never the sole driver of acceptance or denial. The decision engine applies configurable FICO bands and derogatory-credit tolerances — e.g., bankruptcy seasoning periods and disregard thresholds for small medical judgments — with breaches routed through the exception workflow in [LN-08](#ln-08-exceptions-mitigating-factors--overrides). Credit reports older than 6 months at decision time are rejected and a refresh is required. Thin-file borrowers may be evaluated with alternative credit data (rent, utility, deposit history) under the same neutral standards. Band and tolerance configurations are write-restricted to authorized Compliance and Lending administrator roles per [LN-01](#ln-01-governance-roles--program-scope).
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Credit report pulled for an application (`credit_report.received`) | Report date (`credit_report.report_date`), score (`credit_report.score`), derogatories (`credit_report.derogatories[]`) | Report freshness validated; stale reports rejected (`credit_report.freshness_checked`) | At receipt; report must be ≤ 6 months old at decision (enforced by `credit_report.stale_at`) |
  | Score or derogatory tolerance breached (`credit_score.tolerance_breached`) | FICO band config (`credit_config.fico_bands`), seasoning rules (`credit_config.seasoning_rules`), applicant profile (`loan_application.data`) | Exception case opened and routed (`loan_exception.detected`) | Before decision |
  | Thin-file applicant identified (`loan_application.thin_file_flagged`) | Alternative data sources (`credit_report.alternative_data[]`) | Alternative-data evaluation recorded in CAR (`car.alternative_data_used`) | Before decision |

- **ALERTS/METRICS:** Count of decisions made on stale (>6-month) reports (target zero); share of denials where the score was the sole recorded basis (target zero); thin-file approval rates by channel and partner monitored for disparities.

## LN-05 — ATR/QM & Mortgage Underwriting  {#ln-05-atrqm--mortgage-underwriting}

- **WHY (Reg cite):** Reg Z requires a reasonable, good-faith ability-to-repay determination using the eight statutory factors for covered closed-end dwelling-secured loans ([12 CFR §1026.43(c)](https://www.ecfr.gov/current/title-12/part-1026#p-1026.43(c))) and defines qualified-mortgage classifications ([§1026.43(e)](https://www.ecfr.gov/current/title-12/part-1026#p-1026.43(e))).
- **SYSTEM BEHAVIOR:** For covered closed-end 1–4 family dwelling-secured loans, the system requires a completed ATR 8-factor checklist and a QM classification before closing documents print; the doc-prep step is hard-blocked until both exist. A 43% consumer DTI default applies, with capacity for stricter configurable tiers by product (e.g., 35% for first mortgages); DTI breaches route to [LN-08](#ln-08-exceptions-mitigating-factors--overrides). DTI-tier configuration is write-restricted to authorized Compliance and Lending administrator roles per [LN-01](#ln-01-governance-roles--program-scope).
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Covered mortgage file ready for docs (`loan_application.docs_requested`) | ATR 8-factor inputs: income/assets (`loan_application.income_assets`), employment (`loan_application.employment`), payment obligations (`loan_application.obligations[]`), DTI (`loan_application.dti`), credit history (`credit_report.id`) | Completed ATR checklist + QM classification; doc print unblocked (`loan_application.atr_qm_completed`) | Before docs print (enforced by `loan_application.doc_block_state`) |
  | DTI exceeds applicable tier (`loan_application.dti_breached`) | Tier config (`credit_config.dti_tiers`), computed DTI (`loan_application.dti`) | Exception case opened (`loan_exception.detected`) | Before closing |

- **ALERTS/METRICS:** Count of covered loans where docs printed without a sealed ATR/QM record (target zero); QM vs. non-QM mix by product and partner; DTI-exception rate trended by channel.

## LN-06 — Appraisals, Valuations & Collateral  {#ln-06-appraisals-valuations--collateral}

- **WHY (Reg cite):** Reg B requires creditors to provide applicants copies of appraisals and written valuations on first-lien dwelling-secured applications promptly upon completion and to retain related records ([12 CFR §1002.14](https://www.ecfr.gov/current/title-12/part-1002#p-1002.14)); appraisal-independence requirements arise under Reg Z ([§1026.42](https://www.ecfr.gov/current/title-12/part-1026#p-1026.42)).
- **SYSTEM BEHAVIOR:** Appraisals are ordered only from an approved-appraiser list through a channel insulated from loan production staff — no one with an interest in the transaction may select, pressure, or compensate the appraiser. For first-lien dwelling-secured applications, the system auto-generates the free appraisal copy and delivers it promptly upon completion (and no later than 3 business days before consummation), retaining the appraisal and delivery evidence for at least 25 months. Configurable product LTV matrices are enforced at underwriting; LTV breaches route to [LN-08](#ln-08-exceptions-mitigating-factors--overrides). The approved-appraiser list and LTV matrices are write-restricted to authorized Compliance and Lending administrator roles per [LN-01](#ln-01-governance-roles--program-scope).
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Appraisal ordered for collateralized loan (`appraisal.ordered`) | Approved-appraiser list (`appraiser_list.approved[]`), property details (`collateral.property`) | Order placed via independent channel (`appraisal.order_logged`) | At order, real time |
  | Appraisal or valuation completed — first-lien dwelling (`appraisal.completed`) | Appraisal document (`appraisal.document`), applicant delivery address (`loan_party.contact`) | Free copy auto-delivered with delivery evidence (`appraisal.copy_delivered`) | Promptly; ≤ 3 business days before consummation (enforced by `appraisal.delivery_due_at`) |
  | Collateral valued at underwriting (`collateral.valued`) | Product LTV matrix (`credit_config.ltv_matrix`), valuation (`appraisal.value`), loan amount (`loan_application.amount`) | LTV computed and validated; breaches open an exception (`collateral.ltv_checked`) | Before decision |

- **ALERTS/METRICS:** Count of first-lien dwelling files missing delivery evidence at consummation (target zero); appraisal-copy delivery latency distribution; count of orders placed outside the approved list (target zero); LTV-exception rate by product.

## LN-07 — Adverse Action & Notifications  {#ln-07-adverse-action--notifications}

- **WHY (Reg cite):** Reg B requires action-taken notices with specific reasons (or disclosure of the right to them) within 30 days of a completed application or existing-account action, and 90 days after an unaccepted counteroffer ([12 CFR §1002.9](https://www.ecfr.gov/current/title-12/part-1002#p-1002.9)); FCRA requires adverse-action content when a consumer report or score is used ([15 USC §1681m](https://www.law.cornell.edu/uscode/text/15/1681m)).
- **SYSTEM BEHAVIOR:** Every adverse decision — application denial, less-favorable counteroffer, or adverse action on an existing account — generates a combined ECOA/FCRA-compliant notice with specific principal reasons, credit-score disclosures where a score was used, and the ECOA anti-discrimination statement. All denials pass a second-level review for decisioning consistency and fair-lending concerns before the notice issues. A counteroffer accepted within 90 days requires no adverse-action notice; if it expires unaccepted, the notice issues by day 90 from original notification. Notice templates are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Adverse decision on completed application (`loan_application.adverse_action_decided`) | CAR decision basis (`car.decision_basis[]`), reason codes (`loan_application.reason_codes[]`), score disclosure data (`credit_report.score_disclosure`) | AAN with specific reasons + ECOA/FCRA content (`aan.issued`) | 30 days (internal: 5 BD; enforced by `loan_application.aan_due_at`) |
  | Adverse action on existing account (`loan_account.adverse_action_decided`) | Account action basis (`loan_account.action_basis`), reason codes (`loan_account.reason_codes[]`) | Existing-account AAN (`aan.issued`) | 30 days (enforced by `loan_account.aan_due_at`) |
  | Counteroffer expires unaccepted (`loan_application.counteroffer_expired`) | Counteroffer terms (`loan_application.counteroffer_terms`), original notification date (`loan_application.notified_at`) | Counteroffer AAN (`aan.issued`) | 90 days from original notification (enforced by `loan_application.counteroffer_aan_due_at`) |
  | Denial queued for issuance (`aan.queued`) | Denial file (`loan_application.id`), reviewer identity (`user.id`) | Second-level review disposition (`aan.second_review_completed`) | Before notice issues |

- **ALERTS/METRICS:** Aging alerts on AAN queues at 20 and 25 days (application and existing-account) and 80 days (counteroffer); count of notices issued past deadline (target zero); second-level review override rate and fair-lending concern flags trended monthly.

## LN-08 — Exceptions, Mitigating Factors & Overrides  {#ln-08-exceptions-mitigating-factors--overrides}

- **WHY (Reg cite):** Consistent, documented exception handling is a core fair-lending safeguard under Reg B ([§1002.6](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6)) and an NCUA safety-and-soundness expectation ([Part 741](https://www.ecfr.gov/current/title-12/part-741)) — undocumented discretion is the primary vector for disparate treatment.
- **SYSTEM BEHAVIOR:** The decision engine automatically detects breaches of numeric and qualitative rules — DTI, FICO bands, LTV, bankruptcy seasoning, product restrictions — and opens an exception case. Approving an exception requires selection of standardized mitigating factors from a controlled list and routing to the approval-authority tier matching breach severity; free-text-only justifications are rejected. Exceptions must be decided before closing; an open exception blocks doc print and funding. Portfolio-level exception analytics (volume, approval rate, mitigant mix by product, channel, partner, and decision-maker) feed [LN-13](#ln-13-fair-lending-risk-assessment--monitoring). The mitigant list and approval-tier matrix are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Rule breach detected (`loan_exception.detected`) | Breached rule and observed values (`loan_exception.rule`, `loan_exception.observed_value`), applicant file (`loan_application.id`) | Exception case opened with severity tier (`loan_exception.case_opened`) | Real time at breach |
  | Exception submitted for approval (`loan_exception.submitted`) | Standardized mitigants (`loan_exception.mitigants[]`), approver tier (`loan_exception.approval_tier`) | Approved or denied exception with approver identity (`loan_exception.decided`) | Before closing (enforced by `loan_exception.closing_block_state`) |
  | Reporting period closes (`loan_exception.analytics_due`) | All exception cases in period (`loan_exception.case_opened` records) | Portfolio exception analytics report (`loan_exception.analytics_published`) | Quarterly (internal SLA) |

- **ALERTS/METRICS:** Count of loans closed with undecided exceptions (target zero); exception approval rates by decision-maker, product, channel, and partner with outlier flagging; mitigant-usage distribution monitored for rubber-stamp patterns.

## LN-09 — Documentation, Recordkeeping & Retention  {#ln-09-documentation-recordkeeping--retention}

- **WHY (Reg cite):** Reg B requires retention of applications, evaluation information, and notices for 25 months ([12 CFR §1002.12(b)](https://www.ecfr.gov/current/title-12/part-1002#p-1002.12(b))); HMDA/Reg C imposes recordkeeping for covered dwelling-secured credit ([12 CFR §1003.5](https://www.ecfr.gov/current/title-12/part-1003#p-1003.5)).
- **SYSTEM BEHAVIOR:** Every loan and prequalification carries an enforced credit-package schema; booking is blocked until all schema-required documents are present and validated. Applications, Government Monitoring Information, evaluation data, and adverse-action notices are retained at least 25 months — longer where the credit union's retention standard requires (the Record Retention Policy governs the general schedule). Retention holds prevent deletion during examinations or litigation. Credit-package records are write-restricted post-booking; corrections version rather than overwrite.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Loan ready to book (`loan.booking_requested`) | Credit-package schema (`credit_package.schema`), document inventory (`credit_package.documents[]`) | Schema validation; booking blocked if incomplete (`credit_package.validated`) | Before booking (enforced by `loan.booking_block_state`) |
  | Final action taken on application (`loan_application.final_action`) | Application, GMI, evaluation data, notices (`credit_package.documents[]`, `loan_application.gmi`, `aan.issued` records) | Retention clock started on the package (`credit_package.retention_started`) | Retain ≥ 25 months (enforced by `credit_package.retention_expires_at`) |

- **ALERTS/METRICS:** Count of loans booked with incomplete packages (target zero); count of records purged before retention expiry (target zero); package-completeness rate at first booking attempt trended by channel and partner.

## LN-10 — Pricing, Rate Sheets & HPML Controls  {#ln-10-pricing-rate-sheets--hpml-controls}

- **WHY (Reg cite):** Reg Z defines higher-priced mortgage loans by APR spread over APOR and imposes escrow/appraisal obligations ([12 CFR §1026.35](https://www.ecfr.gov/current/title-12/part-1026#p-1026.35)), caps QM points and fees ([§1026.43(e)(3)](https://www.ecfr.gov/current/title-12/part-1026#p-1026.43(e)(3))), and prohibits compensation-based steering ([§1026.36(d),(e)](https://www.ecfr.gov/current/title-12/part-1026#p-1026.36(d))); consistent pricing is also a Reg B nondiscrimination requirement ([§1002.6](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6)).
- **SYSTEM BEHAVIOR:** Rate sheets are refreshed weekly, tied to the published APOR, and pushed simultaneously to direct and partner pricing engines so all channels price from the same source of truth. Before docs print on any covered mortgage, the system runs the HPML spread test and the points-and-fees test; an HPML result triggers the associated escrow and appraisal obligations, and a points-and-fees failure blocks docs. Pricing outside the rate sheet requires the pricing-exception workflow — standardized mitigants and tiered approval consistent with [LN-08](#ln-08-exceptions-mitigating-factors--overrides) — across both direct and partner engines. Rate-sheet publication is write-restricted to the authorized pricing administrator role per [LN-01](#ln-01-governance-roles--program-scope).
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Weekly APOR published (`rate_sheet.apor_published`) | Current APOR values (`rate_sheet.apor_values`), product margin config (`credit_config.margins`) | New rate sheet versioned and distributed to all engines (`rate_sheet.published`) | Weekly (enforced by `rate_sheet.refresh_due_at`) |
  | Mortgage pricing locked (`loan_pricing.locked`) | APR (`loan_pricing.apr`), comparable APOR (`rate_sheet.apor_values`), points and fees (`loan_pricing.points_fees`) | HPML and points-and-fees test results; docs blocked on failure (`loan_pricing.hpml_tested`) | Before docs print (enforced by `loan_application.doc_block_state`) |
  | Off-sheet pricing requested (`loan_pricing.exception_requested`) | Requested rate vs. sheet (`loan_pricing.deviation`), mitigants (`loan_exception.mitigants[]`) | Approved or denied pricing exception with approver (`loan_pricing.exception_decided`) | Before closing |

- **ALERTS/METRICS:** Alert when a rate sheet exceeds 7 days without refresh (target zero); count of covered mortgages docked without HPML/points-and-fees results (target zero); pricing-exception rate and rate-deviation distribution by channel, partner, and originator monitored for disparities.

## LN-11 — OFAC & Sanctions Gate  {#ln-11-ofac--sanctions-gate}

- **WHY (Reg cite):** OFAC sanctions programs ([31 CFR Chapter V](https://www.ecfr.gov/current/title-31/chapter-V)) prohibit extending credit to sanctioned parties; the FFIEC BSA/AML Manual and [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748) set screening and program expectations.
- **SYSTEM BEHAVIOR:** All new borrowers, co-borrowers, and guarantors are screened against OFAC lists before closing, and funding is hard-blocked until every party shows a clear (or cleared) status. An apparent match routes to the BSA/Compliance queue; clearing it requires a documented override rationale and reviewer identity. A confirmed match stops the transaction and escalates under the BSA Policy, which governs the broader sanctions program. Match clearance is write-restricted to BSA/Compliance officers.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Borrower, co-borrower, or guarantor added to a loan (`loan_party.added`) | Party identity (`loan_party.identity`), screening lists and results (`ofac_result.matched_lists[]`, `ofac_result.match_status`) | Screening result recorded (`loan_party.ofac_screened`) | Before closing (enforced by `loan.funding_block_state`) |
  | Apparent match returned (`loan_party.ofac_potential_match`) | Match details and score (`ofac_result.match_status`, `ofac_result.match_score`), reviewer identity (`user.id`) | Cleared-with-rationale or confirmed-match escalation (`loan_party.ofac_cleared` / `loan_party.ofac_escalated`) | Before funding |

- **ALERTS/METRICS:** Count of loans funded with unscreened or unresolved parties (target zero); potential-match clearance latency distribution; count of clearances missing override rationale (target zero).

## LN-12 — Prequalification, Marketing & Steering Controls  {#ln-12-prequalification-marketing--steering-controls}

- **WHY (Reg cite):** Reg B prohibits discouraging applicants on a prohibited basis ([12 CFR §1002.4(b)](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4(b))); Reg Z prohibits steering consumers to loans based on originator compensation ([§1026.36(e)](https://www.ecfr.gov/current/title-12/part-1026#p-1026.36(e))) and governs credit advertising ([§1026.24](https://www.ecfr.gov/current/title-12/part-1026#p-1026.24)); the Fair Housing Act bars discrimination in residential lending ([42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605)).
- **SYSTEM BEHAVIOR:** Prequalification decisions run on neutral, documented criteria identical in kind to underwriting standards — no prohibited-basis fields or proxies. Product-recommendation and menu logic, in both Pynthia-direct and partner online channels, is reviewed to confirm it cannot steer applicants into less favorable products by prohibited basis or proxy variables (e.g., geography, language preference, or device signals used as proxies). Online and partner product menus present the full set of products an applicant qualifies for, ordered by neutral rules. Prequal criteria and menu-logic configurations are write-restricted to authorized roles per [LN-01](#ln-01-governance-roles--program-scope), and changes require Compliance review before deployment.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Prequalification requested (`prequal.requested`) | Neutral criteria set (`prequal.criteria_version`), applicant inputs (`prequal.inputs`) | Prequal result with criteria version recorded (`prequal.decided`) | Real time |
  | Product menu or recommendation logic changed (`product_menu.change_requested`) | Logic diff (`product_menu.diff`), steering-review checklist (`product_menu.steering_review`) | Compliance-approved menu version deployed (`product_menu.deployed`) | Before deployment |
  | Quarterly steering review opens (`steering_review.due`) | Menu outcomes by segment (`product_menu.outcome_metrics`), prequal-to-product mapping (`prequal.product_mapping`) | Steering review report (`steering_review.completed`) | Quarterly (internal SLA) |

- **ALERTS/METRICS:** Count of menu deployments lacking Compliance approval (target zero); product-placement distribution by demographic proxy segment reviewed quarterly; prequal denial-rate disparities by geography flagged for [LN-13](#ln-13-fair-lending-risk-assessment--monitoring).

## LN-13 — Fair Lending Risk Assessment & Monitoring  {#ln-13-fair-lending-risk-assessment--monitoring}

- **WHY (Reg cite):** Reg B requires collection of Government Monitoring Information for covered dwelling-secured applications ([12 CFR §1002.13](https://www.ecfr.gov/current/title-12/part-1002#p-1002.13)); HMDA/Reg C requires data collection and reporting for covered institutions ([12 CFR Part 1003](https://www.ecfr.gov/current/title-12/part-1003)); NCUA's nondiscrimination rule ([§701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31)) prohibits redlining and discriminatory real-estate lending practices.
- **SYSTEM BEHAVIOR:** The lending data warehouse maintains reproducible application, approval, denial, pricing, and loss datasets with GMI, segmentable by product, channel, partner, and geography. A full fair-lending risk assessment runs at least annually — covering underwriting, pricing, steering, redlining, and exception disparities — with findings tracked to remediation closure. Interim monitoring feeds from [LN-08](#ln-08-exceptions-mitigating-factors--overrides) and [LN-12](#ln-12-prequalification-marketing--steering-controls) analytics. Methodology details are governed by the Fair Lending Policy; this control guarantees the lending-side data supply and the annual cadence. GMI fields are write-restricted at collection and masked from underwriting decision views.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Lending decision finalized (`loan_application.decisioned`) | Decision, pricing, GMI, geography, partner attribution (`car.id`, `loan_pricing.apr`, `loan_application.gmi`, `loan_application.geography`, `lending_program.partner_id`) | Record appended to fair-lending dataset (`fair_lending.record_appended`) | 1 business day of decision (internal SLA) |
  | Annual assessment cycle opens (`fair_lending.assessment_due`) | Full-period datasets (`fair_lending.dataset_version`), prior findings (`fair_lending.findings[]`) | Completed risk assessment with findings and remediation plan (`fair_lending.assessment_completed`) | Annually (enforced by `fair_lending.next_assessment_at`) |
  | Remediation item created (`fair_lending.remediation_opened`) | Finding reference (`fair_lending.finding_id`), owner (`user.id`), due date (`fair_lending.remediation_due_at`) | Tracked remediation with closure evidence (`fair_lending.remediation_closed`) | Per remediation plan (enforced by `fair_lending.remediation_due_at`) |

- **ALERTS/METRICS:** Dataset completeness rate, with decisions missing GMI or geography attribution flagged; alert when the assessment exceeds 12 months since last completion (target zero); open remediation items past due (target zero); denial-rate and pricing-disparity ratios by protected-class proxy trended quarterly.

## LN-14 — Insider Lending & Employee Conflicts  {#ln-14-insider-lending--employee-conflicts}

- **WHY (Reg cite):** NCUA lending rules prohibit preferential treatment of officials and employees ([12 CFR §701.21](https://www.ecfr.gov/current/title-12/part-701/section-701.21), within [Part 701](https://www.ecfr.gov/current/title-12/part-701)); consistent treatment of insiders is also a Reg B evenhandedness expectation ([§1002.6](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6)).
- **SYSTEM BEHAVIOR:** Pynthia maintains a no-preferential-terms posture: employees, officers, directors, and their related parties receive the same underwriting standards, pricing, and exception scrutiny as any other member — never looser. Applications are matched against the insider registry at intake; an insider flag must be resolved (conflict-of-interest attestation, recusal of conflicted decision-makers, independent approval routing) before any decision is made. Insider and employee lending activity is reported to the Board or its Lending/Fair Lending Committee on a recurring basis. The insider registry is maintained by and write-restricted to Compliance; conflicted individuals are systematically excluded from approval chains on their own or related-party applications.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Application matched against insider registry (`loan_application.created`) | Insider registry (`insider_registry.entries[]`), applicant and related-party identities (`loan_party.identity`) | Insider flag set or cleared (`loan_application.insider_screened`) | At intake, real time |
  | Insider flag raised (`loan_application.insider_flagged`) | Conflict attestation (`insider_case.attestation`), independent approver assignment (`insider_case.approver_id`) | Resolved insider case; decision unblocked (`insider_case.resolved`) | Before decision (enforced by `loan_application.decision_block_state`) |
  | Governance reporting period closes (`insider_report.due`) | Period insider/employee loan activity (`insider_case.resolved` records, loan terms (`loan_pricing.apr`)) | Board/committee insider-lending report (`insider_report.published`) | Quarterly (internal SLA) |

- **ALERTS/METRICS:** Count of insider-flagged loans decided before case resolution (target zero); rate and pricing comparison of insider vs. comparable member loans with deviation alerts; count of conflicted approvers appearing in their own approval chains (target zero).

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer (serving as Fair Lending Officer). The CCO owns this policy, the governance registry in [LN-01](#ln-01-governance-roles--program-scope), and the annual fair-lending assessment in [LN-13](#ln-13-fair-lending-risk-assessment--monitoring).
- **Required participants:** Chief Lending Officer (credit box, underwriting standards, pricing), Loan Operations (documentation, booking, retention), Underwriting (CAR integrity, exceptions), BSA/Compliance (OFAC gate, insider registry), and the Board or its Lending/Fair Lending Committee (approval, insider-lending reports, assessment results).
- **Approvals:** Patrick Wilson, Chief Compliance Officer. Material changes to controls, the credit box, the prohibited-product list, DTI/LTV/FICO configurations, or notice templates require CCO approval before deployment.
- **Review cadence:** Full policy review at least annually (next review per front-matter); governance mapping updated within 30 days of any new product or program per [LN-01](#ln-01-governance-roles--program-scope); credit box reviewed annually per [LN-02](#ln-02-product-eligibility--prohibited-practices).
- **Cross-references:** Collections Policy (non-accrual, charge-off, delinquency workflow), BSA Policy (AML program beyond the lending OFAC gate), Fair Lending Policy (program governance and analytics methodology), Member and BSA Policies (eligibility, onboarding, CIP), Truth-in-Savings Policy (deposit disclosures), Record Retention Policy (general schedules), Third-Party Risk Policy (partner onboarding and vendor due diligence).

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** The parsed `vocabulary.json` (Cassandra Banking Core API v1.0.0) is banking-core only — it defines no lending entities, no loan events, and an empty events array. Every lending-side resource, field, event, and timer code cited in the EVENTS tables (e.g., `loan_application.*`, `car.*`, `aan.issued`, `loan_exception.*`, `appraisal.*`, `loan_pricing.*`, `rate_sheet.*`, `credit_box.*`, `loan_party.*`, `insider_case.*`, `insider_registry.*`, `fair_lending.*`, `prequal.*`, `product_menu.*`, `credit_config.*`, `lending_program.*`, `credit_package.*`) is the target naming scheme and must be registered by engineering before implementation. The OFAC gate may reuse the existing `verification.ofac_result` structure (`ofac_result.match_status`, `ofac_result.matched_lists`, `ofac_result.match_score`) where loan parties are existing verified entities.
- **HMDA reporter status assumed.** The policy assumes Pynthia is (or will become) a HMDA/Reg C covered institution for dwelling-secured products; if loan volume falls below reporting thresholds, [LN-13](#ln-13-fair-lending-risk-assessment--monitoring) data collection still proceeds for fair-lending monitoring, but Reg C filing obligations would not apply. Needs confirmation from Compliance.
- **Charter type and NCUA applicability assumed.** Pynthia is treated as a federally insured credit union subject to NCUA Parts 701, 741, and 748; if Pynthia is state-chartered, parallel state nondiscrimination and insider rules may apply and should be mapped into [LN-01](#ln-01-governance-roles--program-scope).
- **Internal SLAs are proposed defaults.** The 10-business-day internal decision SLA ([LN-03](#ln-03-applications-acceptance--denial-standards)), 5-business-day AAN SLA ([LN-07](#ln-07-adverse-action--notifications)), quarterly cadences for exception analytics, steering reviews, and insider reports, and the aging-alert thresholds are proposed values needing CCO/CLO confirmation.
- **Approval-tier matrix undefined.** PATRICK_NOTES require tiered exception approval routing ([LN-08](#ln-08-exceptions-mitigating-factors--overrides)) but do not define the tiers (e.g., which breaches need underwriter-manager vs. CLO vs. committee approval). A severity-to-authority matrix must be approved before implementation.
- **Configurable thresholds need initial values.** FICO bands, derogatory-credit tolerances (bankruptcy seasoning periods, small-medical-judgment thresholds), stricter DTI tiers beyond the 43% default and the 35% mortgage example, and product LTV matrices are described as configurable; initial production values require CLO proposal and CCO approval.
- **"Defined private education loans" scope unconfirmed.** The prohibited-products list in [LN-02](#ln-02-product-eligibility--prohibited-practices) blocks "defined private education loans"; the precise definition (all private student loans vs. a subset) needs confirmation.
- **Alternative credit data sources unspecified.** [LN-04](#ln-04-credit-scoring--adverse-credit-history) supports alternative data for thin-file borrowers; approved data sources and their validation standards are not yet selected.
- **Insider registry source unconfirmed.** [LN-14](#ln-14-insider-lending--employee-conflicts) assumes a Compliance-maintained registry of employees, officials, and related parties; the system of record (HRIS feed, board roster, related-party attestations) and refresh cadence need definition.
- **Existing-account adverse-action scope.** [LN-07](#ln-07-adverse-action--notifications) covers existing-account adverse actions (e.g., line reductions); the set of open-end products subject to this path is assumed but not enumerated in PATRICK_NOTES.
