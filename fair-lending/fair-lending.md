---
title: Fair Lending Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v3.2
effective: 2026-06-05
next_review: 2027-06-05
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Fair Lending, ECOA, Reg B, HMDA, Fair Housing, Anti-Steering]
---

## General Policy Statement

Pynthia Credit Union extends credit to all creditworthy applicants without discrimination on any prohibited basis and prohibits disparate treatment, unjustified disparate impact, and redlining across the entire credit lifecycle — inquiries, application, evaluation, pricing, appraisal, action-taken notices, monitoring-data collection, advertising, complaint handling, and record retention — and across all third parties acting for the Credit Union, for whom ECOA liability flows to the Credit Union. Controls combine system enforcement with documented human review and at-least-quarterly Board oversight, and are designed to satisfy the FFIEC Interagency Fair Lending Examination Procedures, including the Compliance Management Analysis Checklist (Appendix §A–B) and the overt, underwriting, pricing, steering, redlining, and marketing risk factors (O1–O5, U1–U9, P1–P7, S1–S8, R1–R12, M1–M7).

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Completed application: approve/counter/deny | Application decisioned (`loan_application.decisioned`) | 30 days | AAN + ECOA notice; score block if score used | [FL-05](#fl-05-action-taken-notices) |
| Incomplete application | Incomplete detected (`loan_application.incomplete_detected`) | 30 days | Notice of incompleteness or AAN | [FL-05](#fl-05-action-taken-notices) |
| Existing-account adverse action | Adverse action decided (`loan_account.adverse_action_decided`) | 30 days | AAN | [FL-05](#fl-05-action-taken-notices) |
| Counteroffer not accepted | Counteroffer expired (`loan_application.counteroffer_expired`) | 90 days | AAN | [FL-05](#fl-05-action-taken-notices) |
| Small-business phone credit (≤$1MM rev) | Oral adverse decision (`loan_application.oral_adverse_decision`) | Reasonable time | Oral/written notice | [FL-05](#fl-05-action-taken-notices) |
| Appraisal/valuation copy | Valuation completed (`valuation.completed`) | Promptly / ≤3 BD | Copy + right-to-receive disclosure | [FL-04](#fl-04-appraisal-independence-and-rov) |
| Reconsideration of value | ROV requested (`valuation.rov_requested`) | 15 days | ROV outcome logged | [FL-04](#fl-04-appraisal-independence-and-rov) |
| Pricing-exception review | Exception period closed (`pricing.exception_period_closed`) | Monthly by 10th | Exception review record | [FL-03](#fl-03-evaluation-and-pricing-rules) |
| Quarterly disparity analytics | Quarter closed (`analytics.quarter_closed`) | 30 days post-close | Disparity report | [FL-10](#fl-10-monitoring-disparity-analytics-and-redlining) |
| Annual redlining review | Annual cycle | By Q1 | Redlining review report | [FL-10](#fl-10-monitoring-disparity-analytics-and-redlining) |
| Third-party Fair-Lending MI pack | Monthly cycle | By 5th BD | MI pack + review | [FL-09](#fl-09-third-party-fair-lending-oversight) |
| HMDA LAR submission | Submission window open (`hmda.submission_window_open`) | Reg C calendar | LAR submission | [FL-06](#fl-06-government-monitoring-and-hmda-lar) |
| Complaint logging | Complaint received (`complaint.received`) | 1 BD | Complaint log entry | [FL-13](#fl-13-fair-lending-complaint-monitoring) |
| Prohibited-basis triage | Complaint logged (`complaint.logged`) | 3 BD | Triage / prohibited-basis flag | [FL-13](#fl-13-fair-lending-complaint-monitoring) |
| Compliance initial assessment | Complaint escalated (`fair_lending.discouragement_reported`) | 10 BD | Issue Register entry + severity | [FL-13](#fl-13-fair-lending-complaint-monitoring) |
| CCO escalation (High/Pattern) | Complaint classified (`complaint.investigation_completed`) | 2 BD | CCO escalation record | [FL-13](#fl-13-fair-lending-complaint-monitoring) |
| Complaint-pattern CAP | Pattern identified (`analytics.threshold_breached`) | 30 days | CAP opened | [FL-13](#fl-13-fair-lending-complaint-monitoring) |
| Onboarding training | Role start (`employee.hired`) | 30 days | Completion record | [FL-11](#fl-11-training) |
| Annual training | Annual cycle | By Dec 31 | Completion record | [FL-11](#fl-11-training) |

## FL-01 — Prohibition, Protected Bases & Inquiry-Stage Discouragement  {#fl-01-prohibition-protected-bases-and-inquiry-stage-discouragement}

- **WHY (Reg cite):** ECOA/Reg B prohibits discrimination in any aspect of a credit transaction and prohibits discouraging applicants on a prohibited basis ([12 CFR §1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4)); FHA prohibits discrimination in residential real-estate-related transactions ([42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605)); NCUA nondiscrimination rules ([12 CFR §701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31)). This control addresses FFIEC overt risk factors O1–O5 and inquiry-stage discouragement (O4–O5; FFIEC Checklist §A.1c) and the preventive measures in Appendix §A.
- **SYSTEM BEHAVIOR:** The system blocks protected traits and proxies (e.g., ZIP/neighborhood, property age/location) from being used at any decision stage by screening application and decision payloads against the Compliance-approved guarded-attribute list and proxy guardrails; flagged use is rejected before decisioning. Staff may not, on a prohibited basis, discourage inquiries or applications through oral statements, delays, differential referrals, or selective disclosure of products or requirements; a reporting-and-escalation pathway routes suspected inquiry-stage discouragement to Compliance for assessment. Compliance reviews the policy annually and reports to the Board quarterly. The guarded-attribute list and proxy guardrails are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Application created and screened for prohibited inquiries (`application.inquiry_check_completed`) | Application data (`loan_application.data`), guarded attributes (`compliance.guarded_attributes_updated`), proxy guardrails (`analytics.cohort_threshold`) | Inquiry-check result + guardrail publication (`compliance.guardrails_published`) | — (internal: at submission) |
  | Suspected inquiry-stage discouragement reported (`fair_lending.discouragement_reported`) | Reporter (`escalation.reporter_id`), facts (`escalation.facts`), severity (`escalation.severity`) | Escalation routed to Compliance (`escalation.routed`) | — (internal: same day) |
  | Annual policy review and quarterly Board report (`compliance.board_report_delivered`) | Board report (`compliance.board_report_id`) | Board report delivered (`compliance.board_report_delivered`) | Quarterly (enforced by `compliance.board_report_due_at`); annual review (enforced by `policy.review_due_at`) |
  | Guarded-attribute list updated (`compliance.guarded_attributes_updated`) | Change rationale (`compliance.change_rationale`) | Guardrails published (`compliance.guardrails_published`) | — (internal: on change) |

- **ALERTS/METRICS:** Target zero blocked-attribute bypasses reaching decision; alert on any discouragement report aging past same-day routing; track quarter-over-quarter discouragement-report volume and disposition.

## FL-02 — Permissible Inquiries & Required Disclosures  {#fl-02-permissible-inquiries-and-required-disclosures}

- **WHY (Reg cite):** Reg B limits inquiries about spouse, marital status, sex, childbearing, and immigration to what is permitted and governs information collected ([12 CFR §1002.5](https://www.ecfr.gov/current/title-12/part-1002#p-1002.5)). Addresses FFIEC overt factor O2 and Appendix §A preventive measures on improper inquiries.
- **SYSTEM BEHAVIOR:** The application form is rendered with only permissible inquiry fields for the requested credit type, and required disclosures (e.g., alimony/child-support optional-income notice) are presented before sensitive fields are collected; the system records disclosure presentation against each application. Prohibited inquiries are suppressed by product configuration. Form templates are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Application form rendered for collection (`application.form_rendered`) | Product type (`loan_application.product_type`), application channel (`application.channel`) | Form rendered with permissible fields (`application.form_rendered`) | — (internal: at render) |
  | Disclosures presented before sensitive fields (`application.disclosures_presented`) | Applicant identity (`enrollment.applicant_identity`), required disclosure template (`disclosure.template_id`) | Disclosures presented record (`application.disclosures_presented`) | — (internal: before collection) |
  | Form template change submitted/approved (`form.template_approved`) | Template diff (`form.template_diff`) | Approved template (`form.template_approved`) | — (internal: on change) |

- **ALERTS/METRICS:** Target 100% of applications with required disclosures presented before sensitive-field collection; alert on any application reaching submission without recorded disclosure presentation.

## FL-03 — Evaluation & Pricing Rules  {#fl-03-evaluation-and-pricing-rules}

- **WHY (Reg cite):** Reg B governs evaluation of applications, requires equal treatment of public-assistance income, and prohibits negative factors for elderly applicants ([12 CFR §1002.6](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6)); definitions of empirically derived, demonstrably and statistically sound systems ([12 CFR §1002.2](https://www.ecfr.gov/current/title-12/part-1002#p-1002.2)). Addresses FFIEC underwriting and pricing risk factors U1–U9 and P1–P7.
- **SYSTEM BEHAVIOR:** Underwriting uses demonstrably/statistically sound scoring or documented judgmental criteria; the system blocks assignment of negative factors to elderly applicants and treats public-assistance income equally with other income. Pricing exceptions and overrides must be captured with rationale and approved before lock; finalization is blocked without a recorded exception decision. Compliance reviews pricing exceptions monthly by the 10th. Pricing-exception approval authority and the scoring/credit configuration are write-restricted to Compliance and authorized credit officers.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Pricing exception raised at quote (`loan_pricing.exception_requested`) | Sheet price (`pricing.sheet_price`), proposed price (`pricing.proposed_price`), rationale (`pricing.exception_rationale`) | Exception decision (`loan_pricing.exception_decided`) | — (internal: before price lock) |
  | Pricing locked after evaluation (`loan_pricing.locked`) | APR (`loan_pricing.apr`), points/fees (`loan_pricing.points_fees`), deviation (`loan_pricing.deviation`) | Price lock recorded (`loan_pricing.locked`) | — (internal: at decision) |
  | Monthly pricing-exception review (`pricing.exception_review_completed`) | Exception demographics summary (`pricing.exception_demographics_summary`), approver (`pricing.exception_approver`) | Exception review completed (`pricing.exception_review_completed`) | Monthly by 10th (enforced by `pricing.exception_review_due_at`) |
  | Credit/scoring config changed (`credit_config.changed`) | Config diff (`credit_config.diff`), approval (`credit_config.approval_id`) | Config change recorded (`credit_config.changed`) | — (internal: on change) |

- **ALERTS/METRICS:** Target 100% of pricing exceptions approved before lock; alert on any monthly exception review not completed by the 10th; track exception rate and demographic distribution of exceptions.

## FL-04 — Appraisal Independence & ROV  {#fl-04-appraisal-independence-and-rov}

- **WHY (Reg cite):** Reg B requires providing appraisals and written valuations and governs valuation independence and the reconsideration-of-value pathway ([12 CFR §1002.14](https://www.ecfr.gov/current/title-12/part-1002#p-1002.14)); NCUA nondiscrimination/valuation rules ([12 CFR §701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31)). Addresses FFIEC redlining factor R8 (valuation practices) and collateral-evaluation fairness.
- **SYSTEM BEHAVIOR:** Valuation staff are separated from production influence; the system orders appraisals through an independent assignment path and applies a bias-screen ruleset to flag biased or prohibited-factor reliance before use. Applicants receive a right-to-receive disclosure and a free copy of appraisals and written valuations promptly after completion regardless of credit outcome. A reconsideration-of-value pathway captures requests and logs outcomes, with ROV review completed within 15 days of request. Bias-screen rules and ROV decision authority are write-restricted to Compliance and the valuation function.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Valuation completed and screened (`valuation.completed`) | Appraisal value (`appraisal.value`), bias-screen ruleset (`valuation.bias_screen_rules`) | Valuation completed + copy sent (`valuation.copy_sent`) | Promptly / ≤3 BD (enforced by `appraisal.delivery_due_at`) |
  | Right-to-receive disclosure sent (`valuation.rights_disclosure_sent`) | Applicant identity (`enrollment.applicant_identity`), first-lien flag (`loan_application.atr_qm_result`) | Disclosure sent (`valuation.rights_disclosure_sent`) | At application (internal: ≤3 BD of application) |
  | ROV requested (`valuation.rov_requested`) | Valuation report (`appraisal.document`), request basis (`disclosure.requested`) | ROV decision logged (`valuation.rov_decided`) | 15 days (enforced by `valuation.rov_due_at`) |

- **ALERTS/METRICS:** Target zero appraisals used after a bias-screen flag without documented resolution; alert on any ROV pending past 15 days; track valuation-copy on-time delivery rate.

## FL-05 — Action-Taken Notices  {#fl-05-action-taken-notices}

- **WHY (Reg cite):** Reg B governs the timing and content of action-taken/adverse-action notices, including the score block when a credit score is used ([12 CFR §1002.9](https://www.ecfr.gov/current/title-12/part-1002#p-1002.9)); FCRA §615 adverse-action content where a consumer report is used ([15 USC §1681m](https://www.law.cornell.edu/uscode/text/15/1681m)). Addresses FFIEC underwriting factors U1–U2 (timing/disparities) and Appendix §A on prompt, accurate denial communication.
- **SYSTEM BEHAVIOR:** The system generates and sends action-taken notices per the [Timing Matrix](#timing-matrix): completed-application approve/counter/deny within 30 days; incomplete within 30 days (notice of incompleteness or AAN); existing-account adverse action within 30 days; unaccepted counteroffer within 90 days; small-business phone credit (≤$1MM revenue) within a reasonable time. Notices include specific reasons and a credit-score block when a score is used. A counteroffer accepted or used within the offer period requires no separate AAN; a notice of incompleteness must specify the missing information and a reasonable time to provide it. AAN templates and content are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Completed application decisioned adversely (`loan_application.decisioned`) | Applicant identity (`enrollment.applicant_identity`), decision basis (`loan_application.action_basis`), score block (`decision.score_block`) | AAN with specific reasons + ECOA notice (`aan.issued`) | 30 days (enforced by `loan_application.aan_due_at`) |
  | Incomplete application detected (`loan_application.incomplete_detected`) | Missing items (`document.required_set`), applicant identity (`enrollment.applicant_identity`) | Notice of incompleteness or AAN (`loan_application.incompleteness_notice_sent`) | 30 days (enforced by `application.notice_due_at`) |
  | Existing-account adverse action decided (`loan_account.adverse_action_decided`) | Account decision basis (`loan_account.action_basis`) | AAN issued (`aan.issued`) | 30 days (enforced by `loan_account.aan_due_at`) |
  | Counteroffer not accepted/used (`loan_application.counteroffer_expired`) | Counteroffer terms (`loan_application.counteroffer_terms`), counteroffer status (`loan_application.counteroffer_status`) | AAN issued (`aan.issued`) | 90 days (enforced by `loan_application.counteroffer_aan_due_at`) |
  | Small-business phone credit adverse decision (`loan_application.oral_adverse_decision`) | Business revenue tier (`applicant.business_revenue_tier`), oral statement (`loan_application.oral_statement`) | Oral notice logged (`notice.oral_logged`) | Reasonable time (internal: ≤30 days) |

- **ALERTS/METRICS:** Target on-time AAN rate ≥ 99.5% with zero breaches; aging alert on any notice approaching its `*_aan_due_at`; track score-block inclusion rate where a score was used.

## FL-06 — Government Monitoring & HMDA/LAR  {#fl-06-government-monitoring-and-hmda-lar}

- **WHY (Reg cite):** Reg B monitoring-data collection for covered dwelling-secured transactions ([12 CFR §1002.13](https://www.ecfr.gov/current/title-12/part-1002#p-1002.13)); HMDA/Reg C GMI collection, LAR, and submission ([12 CFR §1003.4](https://www.ecfr.gov/current/title-12/part-1003#p-1003.4)). Addresses FFIEC compliance-program factor C2 (monitoring data completeness) and Part III.A (data accuracy).
- **SYSTEM BEHAVIOR:** For covered transactions the system requests GMI (ethnicity, race, sex, marital status, age) but does not require it, and records via the visual/surname rule where required if the applicant declines. The system maintains LAR rows with field-level validation, runs quarterly LAR quality control, and submits per the Reg C calendar. GMI data is segregated from credit decisioning and is write-restricted to authorized roles.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | HMDA-covered application created (`application.hmda_covered_created`) | GMI responses (`applicant.gmi_responses`), application data (`loan_application.gmi`) | GMI recorded (incl. visual/surname where required) (`hmda.gmi_recorded`) | — (internal: at application) |
  | LAR row recorded for action (`hmda.lar_row_recorded`) | LAR value (`lar.value`), application final action (`loan_application.final_action`) | LAR row recorded (`hmda.lar_row_recorded`) | — (internal: at action) |
  | Quarterly LAR QC performed (`hmda.lar_qc_completed`) | LAR dataset (`hmda.hmda_lar`), DQ variance (`dq.variance_amount`) | LAR QC completed (`hmda.lar_qc_completed`) | Quarterly (enforced by `hmda.lar_qc_due_at`) |
  | HMDA submission window open (`hmda.submission_window_open`) | Final LAR (`hmda.lar_final`) | LAR submitted (`hmda.lar_submitted`) | Reg C calendar (enforced by `hmda.submission_due_at`) |

- **ALERTS/METRICS:** Target zero LAR field-validation errors at submission; alert on quarterly QC not completed by due date; track GMI capture/visual-surname completion rate for covered files.

## FL-07 — Advertising & Fair Housing (Accessibility & Marketing Reach)  {#fl-07-advertising-and-fair-housing-accessibility-and-marketing-reach}

- **WHY (Reg cite):** Reg Z advertising disclosures (trigger terms, APR prominence) ([12 CFR §1026.24](https://www.ecfr.gov/current/title-12/part-1026#p-1026.24)); FHA fair-housing advertising and the Equal Housing Lender legend ([42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605); [12 CFR §701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31)); ADA accessibility for digital marketing and application flows ([28 CFR Part 36](https://www.ecfr.gov/current/title-28/part-36)). Addresses FFIEC marketing risk factors M1–M7.
- **SYSTEM BEHAVIOR:** Although Pynthia does not currently anticipate significant consumer advertising, these controls are always-on and scale with advertising activity rather than activating only above a volume threshold. Before any ad launches, a pre-flight checklist must be approved: trigger-term disclosures and APR prominence are enforced, the Fair Housing legend is applied to real-estate ads, and exclusionary geo-targeting is blocked by a targeting screen. Digital marketing and application flows must make reasonable accommodations for applicants with disabilities (WCAG/ADA validation). Any advertising program is assessed periodically to confirm it is not systematically excluding prohibited-basis group members from the market, including review of media selection, geo-targeting, and intermediary relationships. Ad approval and the targeting ruleset are write-restricted to Compliance and Marketing leadership.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Ad pre-flight submitted for approval (`ad.preflight_submitted`) | Creative (`ad.creative`), medium (`advertising.medium`), audience definition (`ad.audience_definition`) | Pre-flight decision (`ad.preflight_decided`) | — (internal: before launch) |
  | Targeting screened for exclusion (`ad.targeting_screen_completed`) | Audience definition (`ad.audience_definition`), geo dataset (`analytics.geo_lending_dataset`) | Targeting screen completed (`ad.targeting_screen_completed`) | — (internal: before launch) |
  | Accessibility check on digital flow (`ad.accessibility_check`) | WCAG checklist (`cda.wcag_checklist`), ADA validation (`privacy.ada_validation_id`) | Accessibility accommodation provided (`accessibility.accommodation_provided`) | — (internal: before launch) |
  | Ad published (`advertising.published`) | Approval id (`advertising.approval_id`), asset id (`advertising.asset_id`) | Publication logged (`advertising.publication_logged`) | — (internal: at launch) |
  | Periodic marketing-reach review (`advertising.reach_review_completed`) | Demographic reach dataset (`analytics.assessment_area`), intermediary list (`intermediary.approved_list`) | Reach review completed (`advertising.reach_review_completed`) | Periodic (enforced by `advertising.reach_review_due`) |

- **ALERTS/METRICS:** Target 100% of ads with a completed approved checklist before launch; target zero ads launched with a failed targeting or accessibility screen; track marketing-reach review completion and any flagged exclusion.

## FL-08 — Loan Originator Compensation & Anti-Steering  {#fl-08-loan-originator-compensation-and-anti-steering}

- **WHY (Reg cite):** Reg Z prohibits loan-originator compensation based on loan terms or proxies and requires anti-steering options ([12 CFR §1026.36(d),(e)](https://www.ecfr.gov/current/title-12/part-1026#p-1026.36)). Addresses FFIEC steering risk factors S1–S8 and underwriting factor U8 (volume-based comp).
- **SYSTEM BEHAVIOR:** The system prohibits originator compensation tied to loan terms or proxies by validating comp-plan basis against approved criteria. Before finalization, the system presents and documents meaningful alternatives (lowest rate, lowest fees, lowest total cost) and blocks finalization without recorded evidence of options presented. Where fewer than three eligible options exist, the system requires a Compliance waiver with a documented shortfall reason. Comp-plan approval and waiver authority are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | LO comp plan submitted (`lo_comp.plan_submitted`) | Plan terms (`lo_comp.plan_terms`), basis analysis (`lo_comp.basis_analysis`) | Comp-plan decision (`lo_comp.plan_decided`) | — (internal: before activation) |
  | Option selection started at offer (`application.option_selection_started`) | Requested terms (`loan_application.requested_terms`), product menu (`product_menu.diff`) | Options presented (`application.options_presented`) | — (internal: before finalization) |
  | Fewer than three eligible options (`application.option_shortfall_detected`) | Shortfall reason (`loan_application.option_shortfall_reason`) | Option waiver decision (`application.option_waiver_decided`) | — (internal: before finalization) |
  | Steering review of placement outcomes (`steering_review.completed`) | Outcome metrics (`product_menu.outcome_metrics`) | Steering review completed (`steering_review.completed`) | Periodic (enforced by `steering_review.due`) |

- **ALERTS/METRICS:** Target zero finalizations without recorded options evidence; target zero comp plans activated with a prohibited basis; track option-shortfall waiver frequency by originator and product.

## FL-09 — Third-Party Fair-Lending Oversight  {#fl-09-third-party-fair-lending-oversight}

- **WHY (Reg cite):** ECOA liability flows to the creditor for third-party conduct in any aspect of a credit transaction ([12 CFR §1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4)); FHA covers brokers/agents and intermediaries ([42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605)). Addresses FFIEC factors U8, P1–P2, S5–S6, M3 (intermediary/broker conduct) and Appendix §A on third-party controls.
- **SYSTEM BEHAVIOR:** The system requires fair-lending due diligence at vendor/partner onboarding and ingests a monthly Fair-Lending MI pack (applications, approvals, pricing, exceptions, complaints) due by the 5th business day. Breaches of MI thresholds open corrective action plans, escalated as needed. Fair-lending contractual clauses are required of third parties acting for the Credit Union. Vendor fair-lending classification and MI thresholds are write-restricted to Compliance and Third-Party Risk Management.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Vendor onboarding fair-lending DD (`vendor.fl_dd_completed`) | DD package (`vendor.dd_package`), service scope (`vendor.service_description`) | Fair-lending DD completed (`vendor.fl_dd_completed`) | — (internal: before activation) |
  | Monthly Fair-Lending MI pack received (`vendor.mi_reviewed`) | MI pack (`vendor.mi_pack`), MI trends (`vendor.mi_trends`) | MI reviewed (`vendor.mi_reviewed`); period closed (`vendor.mi_period_closed`) | By 5th BD (enforced by `vendor.mi_due_at`) |
  | MI threshold breach detected (`vendor.mi_breach_detected`) | Breach detail (`vendor.breach_detail`), affected scope (`vendor.affected_scope`) | CAP issued (`vendor.cap_issued`) | — (internal: on detection) |

- **ALERTS/METRICS:** Target 100% on-time monthly MI packs by the 5th BD; alert on any MI threshold breach without an opened CAP; track CAP closure rate and aging by partner.

## FL-10 — Monitoring, Disparity Analytics & Redlining  {#fl-10-monitoring-disparity-analytics-and-redlining}

- **WHY (Reg cite):** ECOA/FHA prohibit redlining and disparate treatment/impact across geographies and applicants ([12 CFR §1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4); [42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605)); NCUA nondiscrimination ([12 CFR §701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31)). Addresses FFIEC redlining factors R1–R12 and the Part III.G six-step comparative redlining analysis, plus underwriting/pricing factors U1–U9 and P1–P7.
- **SYSTEM BEHAVIOR:** The system runs quarterly disparity analytics across applications, approvals, price, terms, denials, and exceptions, due within 30 days of quarter close, and an annual redlining review by Q1. The annual redlining review follows the FFIEC Part III.G framework: it covers the institution's CRA assessment area and reasonably expected market area; analyzes census-tract-level lending distribution by minority-concentration quartile; incorporates peer comparison data; and applies the six-step comparative analysis (identify minority areas; assess less-favorable treatment; identify favored non-minority areas; identify excluded adjacent minority areas; obtain and evaluate the institution's explanations; obtain corroborating/contradicting evidence). A documented redlining-methodology procedure supplements this control. Disparity deltas beyond Compliance-defined thresholds trigger a CAP, with Board reporting and corrective actions. Disparity thresholds for CAP triggers are `[THRESHOLD NEEDED]` — Compliance has not yet finalized these and this is flagged as a pre-exam priority; do not apply invented thresholds. Disparity thresholds and analytics methods are write-restricted to Compliance and Analytics.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarter closed for analytics (`analytics.quarter_closed`) | Lending dataset (`analytics.lending_dataset`), group estimators (`analytics.group_estimators`) | Disparity report completed (`analytics.disparity_report_completed`) | 30 days post-close (enforced by `analytics.disparity_due_at`) |
  | Annual redlining review run (`analytics.redlining_review_completed`) | Geo lending dataset (`analytics.geo_lending_dataset`), assessment area (`analytics.assessment_area`), cohort threshold (`analytics.cohort_threshold`) | Redlining review completed (`analytics.redlining_review_completed`) | By Q1 (enforced by `analytics.redlining_due_at`) |
  | Disparity threshold breached (`analytics.threshold_breached`) | Breach detail (`analytics.breach_detail`), disparity thresholds (`compliance.disparity_thresholds`) | CAP opened (`analytics.cap_opened`) | — (internal: on detection) |
  | Analytics method reviewed (`analytics.method_review_completed`) | Method/estimators (`analytics.group_estimators`) | Method review completed (`analytics.method_review_completed`) | Periodic (enforced by `analytics.method_review_due`) |

- **ALERTS/METRICS:** Alert on quarterly disparity report not completed within 30 days of quarter close; alert on annual redlining review not completed by Q1; target a CAP opened for every threshold breach; track disparity-delta trend by product, geography, and protected class once thresholds are finalized.

## FL-11 — Training  {#fl-11-training}

- **WHY (Reg cite):** Reg B and FHA compliance depends on staff understanding prohibited bases and credit-access requirements ([12 CFR §1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4); [42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605)). Addresses FFIEC compliance-program factor C7 (training) and Appendix §A preventive training measures.
- **SYSTEM BEHAVIOR:** The system assigns role-based onboarding training within 30 days of role start and annual training due by December 31, including contractors and third parties, and tracks completion to ≥ 98%. Training content refreshes on rule or product changes, triggering re-assignment. Curriculum assignment and content versions are write-restricted to Compliance and HR/Training.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Covered role started (`employee.hired`) | Assignee (`training.assignee_id`), role curriculum (`training.role_matrix`), hire date (`training_detail.hire_date`) | Onboarding training assigned (`training.assigned`) | 30 days (enforced by `training.onboarding_due_at`) |
  | Annual training cycle opened (`training.annual_cycle_opened`) | Curriculum id (`training.curriculum_id`), content version (`training.content_version`) | Annual training assigned (`training.annual_assigned`) | By Dec 31 (enforced by `training.annual_due_at`) |
  | Rule/product change detected (`training.content_trigger_detected`) | Change summary (`training.change_summary`), refresher curriculum (`training.refresher_curriculum`) | Refresh issued (`training.refresh_issued`) | — (internal: on change) |
  | Training completed (`training.completed`) | Completion status (`training.completion_status`), coverage pct (`training.coverage_pct`) | Completion recorded (`training.completion_recorded`) | — (internal: by due date) |

- **ALERTS/METRICS:** Target completion ≥ 98%; alert on any onboarding assignment past 30 days or annual completion past Dec 31; track refresher completion after each rule/product change.

## FL-12 — Record Retention  {#fl-12-record-retention}

- **WHY (Reg cite):** Reg B retention requirements for applications, evaluations, notices, and monitoring data ([12 CFR §1002.12](https://www.ecfr.gov/current/title-12/part-1002#p-1002.12)); HMDA/GMI and LO-comp retention per their calendars ([12 CFR §1003.4](https://www.ecfr.gov/current/title-12/part-1003#p-1003.4); [12 CFR §1026.25](https://www.ecfr.gov/current/title-12/part-1026#p-1026.25)). Addresses FFIEC factor C3 (recordkeeping reliability) and Part III.A (data accuracy).
- **SYSTEM BEHAVIOR:** The system retains fair-lending records per the grid: consumer applications/decisions and existing-account adverse actions 25 months; business credit ≤$1MM 12 months; certain business credit >$1MM 60 days (extended to 12 months if reasons or retention requested); HMDA/GMI and LO-comp per their calendars; self-tests 25 months. Litigation or investigation holds suspend disposal and extend retention on affected records until release. Retention schedules and legal-hold placement/release are write-restricted to Compliance and Legal.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Fair-lending record created (`record.created`) | Record class (`record.retention_class`), retention anchor (`record.retention_anchor` / `retention_spec.anchor_date`) | Retention clock set (`record.retention_clock_set`) | — (internal: at creation) |
  | Litigation/investigation hold placed (`legal_hold.created`) | Hold scope (`legal_hold.hold_scope`), matter id (`legal_hold.matter_id`) | Hold applied; retention extended (`record.retention_extended`) | — (internal: on hold) |
  | Retention period expired (no hold) (`record.retention_expired`) | Retention class (`record.retention_class`), disposal eligibility (`record.disposal_eligible`) | Disposal executed + certificate (`disposal.certificate_recorded`) | Per grid (enforced by `record.retention_expires_at`) |

- **ALERTS/METRICS:** Target zero disposals of records under a hold; alert on records eligible for disposal but not dispositioned past schedule; track hold placement/release reconciliation.

## FL-13 — Fair-Lending Complaint Monitoring  {#fl-13-fair-lending-complaint-monitoring}

- **WHY (Reg cite):** ECOA/FHA require fair treatment across the credit lifecycle and underpin complaint-driven detection of disparate treatment, discriminatory pricing, inquiry-stage discouragement, redlining, and steering ([12 CFR §1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4); [42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605)); NCUA nondiscrimination ([12 CFR §701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31)). This control addresses FFIEC risk factors U9 (underwriting complaints), P5 (pricing complaints), S7 (steering complaints), and M7 (marketing complaints), all of which ask whether management monitors discrimination complaints, and satisfies the FFIEC Compliance Management Analysis Checklist items requiring documented complaint intake, analysis, and response processes (Appendix §A–B).
- **SYSTEM BEHAVIOR:** **Intake and logging.** The system captures complaints from all channels (member-direct, CFPB portal, NCUA, state regulators, third-party partners, internal staff referrals) into a centralized complaint log within one business day of receipt; each record includes date received, channel, member/applicant identifier, product type, complaint description, and the receiving staff member. **Prohibited-basis triage.** Every complaint is screened within three business days for fair-lending relevance and assigned a prohibited-basis flag against ECOA/Reg B protected classes (race, color, religion, national origin, sex, marital status, age, familial status, disability, income from public assistance, exercise of CCPA rights) and FHA classes where real-estate credit is involved; potentially fair-lending-related complaints are escalated immediately to Compliance. **Compliance review and escalation.** Compliance completes an initial fair-lending assessment within ten business days; complaints alleging or suggesting disparate treatment, discriminatory pricing, inquiry-stage discouragement, redlining, or steering are logged in the Fair-Lending Issue Register with a severity rating (Low / Medium / High / Potential Pattern), and High-severity or Pattern-Potential complaints are escalated to the Chief Compliance Officer within two business days of classification and reported to the Board at the next quarterly cycle. **Pattern analysis.** Compliance reviews the complaint log quarterly, segmented by prohibited basis, product type, loan officer, branch, and third-party partner; any cluster of three or more complaints of the same type within a 12-month rolling window triggers a root-cause investigation and corrective action plan (CAP) within 30 days of identification, and the quarterly Monitoring & Reviews report (see [FL-10](#fl-10-monitoring-disparity-analytics-and-redlining)) includes a complaint-pattern summary. **Remediation tracking.** When a confirmed violation or pattern is identified, Compliance documents and tracks (1) re-underwriting or reconsideration of affected application(s); (2) credit offers or fee refunds where the member suffered quantifiable harm; (3) corrective action for the responsible staff member, loan officer, or third party; and (4) process or system changes to prevent recurrence; remediation status is tracked to closure in the Fair-Lending Issue Register, with target remediation timelines set at intake and monitored by Compliance monthly. **Regulator self-referral.** If Compliance determines a pattern may constitute a systemic or willful violation of ECOA, FHA, or related statutes, the Chief Compliance Officer must assess self-referral obligations to the NCUA (and, where applicable, the CFPB or DOJ) in consultation with Legal; the self-referral assessment is documented and retained regardless of outcome. **Reporting.** The program produces (a) a monthly complaint-log summary to Compliance management; (b) a fair-lending complaint section in the quarterly Board compliance report; and (c) an annual fair-lending complaint trend report including year-over-year volume, prohibited-basis distribution, resolution times, remediation outcomes, and any self-referral activity. The Fair-Lending Issue Register, severity ratings, and self-referral determinations are write-restricted to Compliance and the CCO.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Complaint received from any channel (`complaint.received`) | Channel (`complaint.channel`), member/applicant id (`complaint.member_id`), product type (`loan_application.product_type`), description (`complaint.investigation_notes`), receiving staff (`service.assigned_to`) | Centralized complaint log entry (`complaint.logged`) | 1 BD (enforced by `complaint.ack_due_at`) |
  | Complaint screened for prohibited basis (`complaint.logged`) | Complaint category (`complaint.category`), protected-class screen (`compliance.guarded_attributes_updated`) | Prohibited-basis flag + escalation (`fair_lending.discouragement_reported`) | 3 BD (enforced by `complaint.trend_review_due` triage task) |
  | Compliance initial fair-lending assessment (`complaint.investigation_completed`) | Investigation notes (`complaint.investigation_notes`), severity (`escalation.severity`) | Issue Register entry + severity (`fair_lending.assessment_completed`) | 10 BD (enforced by `complaint.initial_response_due_at`) |
  | High/Pattern complaint classified (`complaint.investigation_completed`) | Severity rating (`escalation.severity`), facts (`escalation.facts`) | CCO escalation + Board flag (`finding.critical_escalated`) | 2 BD (enforced by `finding.escalation_due_at`) |
  | Quarterly complaint-pattern review (`analytics.quarter_closed`) | Complaint log segmented (`complaint.trend_summary`), cluster threshold (`analytics.cohort_threshold`) | Pattern summary + CAP on cluster ≥3/12mo (`analytics.cap_opened`) | Quarterly review (enforced by `complaint.trend_review_due`); CAP within 30 days (enforced by `cap.approval_timer`) |
  | Confirmed violation/pattern remediation (`fair_lending.remediation_opened`) | Remediation plan (`cap.retest_plan`), harm/refund basis (`dispute.correction_amount`), responsible party (`finding.responsible_party`) | Remediation tracked to closure in Issue Register (`fair_lending.remediation_closed`) | Target timeline at intake; monitored monthly (enforced by `fair_lending.remediation_due_at`) |
  | Self-referral assessment (`regulator.memo_filed`) | Pattern determination (`incident.reportability_determination`), legal consult (`legal.consulted`) | Self-referral assessment documented + NCUA/CFPB/DOJ notice if required (`ncua.notification_sent`) | — (internal: on systemic/willful determination) |
  | Reporting cycle (`complaint.trend_reported`) | Monthly log summary (`complaint.trend_summary`), board report (`compliance.board_report_id`), annual trend metrics (`incident_trend.report_issued`) | Monthly summary, quarterly Board section, annual trend report (`complaint.trend_reported`) | Monthly / quarterly / annual (enforced by `complaint.trend_review_due`, `compliance.board_report_due_at`) |

- **ALERTS/METRICS:** Target 100% of complaints logged within 1 BD and triaged within 3 BD; alert on any escalated complaint not assessed within 10 BD; alert on any High/Pattern complaint not escalated to the CCO within 2 BD; target a CAP opened within 30 days for every cluster of ≥3 same-type complaints in a 12-month window; track remediation closure rate, resolution times, prohibited-basis distribution, and self-referral activity year over year.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer. Centralized governance of all controls resides with the CCO.
- **Required participants:** Lending Operations, Analytics, Third-Party Risk Management, Legal, HR/Training, and Marketing, as applicable to each control.
- **Approvals:** Patrick Wilson, Chief Compliance Officer.
- **Board reporting:** At least quarterly, including disparity analytics, complaint patterns (see [FL-13](#fl-13-fair-lending-complaint-monitoring)), redlining-review status (see [FL-10](#fl-10-monitoring-disparity-analytics-and-redlining)), corrective actions, and any self-referral activity.
- **Review cadence:** Annual policy review (next review per front-matter), with interim updates on rule, product, or organizational change.
- **Examiner readiness:** Each control is mapped to its corresponding FFIEC risk factors and Compliance Management Analysis Checklist items (Appendix §A–B); gaps are tracked as placeholders in the control text and in Assumptions & Gaps.
- **Cross-references / out of scope:** General underwriting and credit policy (Lending Policy); collections operations beyond fair-lending conduct (Collections Policy); model development/validation/governance (Enterprise Risk Management Policy and Model Risk Management Program); third-party onboarding/oversight mechanics (Third-Party Risk Policy); privacy notices/data handling (Privacy Policy); general retention schedules outside fair-lending records (Record Retention Policy).

## Assumptions & Gaps  {#assumptions}

- **Disparity thresholds not yet defined.** FL-10 carries a `[THRESHOLD NEEDED]` placeholder for the disparity-delta thresholds that trigger a CAP. Compliance must finalize these before the next exam cycle; no thresholds have been invented in this policy. This is a flagged pre-exam priority.
- **Redlining methodology procedure.** FL-10 summarizes the FFIEC Part III.G six-step framework. If a standalone redlining-methodology procedure document does not yet exist, Compliance should create one and link it from FL-10; otherwise the in-policy summary governs.
- **Engineering vocabulary is provisional.** Several lending-side and fair-lending fields, events, and timers referenced in the EVENTS tables are not yet registered in `core-vocabulary.json` (the parsed spec is banking-core, with fair-lending concepts partly under "Provisional codes"). Codes used follow the registered or agreed provisional spellings where available (e.g., `loan_application.decisioned`, `aan.issued`, `analytics.disparity_report_completed`, `valuation.rov_decided`, `complaint.logged`, `fair_lending.assessment_completed`, `pricing.exception_review_completed`); any not yet registered (including the FL-13 triage/severity routing reusing `fair_lending.discouragement_reported` and `finding.critical_escalated`, and the 3-BD triage relying on the generic `triage` task pattern) will be confirmed by engineering before the next review. No new subjects, verbs, or task types were minted.
- **Complaint modeled across entities.** Fair-lending complaints reuse the registered `complaint` entity plus `service`/`incident`/`fair_lending` events and the `finding` Issue-Register pattern rather than coining a dedicated Fair-Lending Issue Register entity; engineering to confirm the Issue Register maps to `finding` records with a fair-lending classification.
- **Small-business "reasonable time."** FL-05 treats the small-business phone-credit notice as an internal ≤30-day SLA absent a registered timer; Compliance to confirm the operational definition of "reasonable time."
- **Charter and reporter status.** This policy assumes Pynthia is an NCUA-supervised credit union subject to Part 701.31 and is a HMDA reporter for covered transactions (FL-06). If reporter status or HMDA coverage thresholds differ, FL-06 scope must be confirmed.
- **Third-party MI thresholds.** FL-09 references MI thresholds that open CAPs; specific threshold values are owned by Compliance/Third-Party Risk Management and were not provided. To be confirmed.
- **Advertising profile.** FL-07 documents always-on advertising controls notwithstanding Pynthia's stated limited advertising profile; periodic marketing-reach review cadence (e.g., annual) is assumed and should be confirmed by Compliance and Marketing.
