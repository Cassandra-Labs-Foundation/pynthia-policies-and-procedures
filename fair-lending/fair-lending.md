```markdown
---
title: Fair Lending Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2025-07-01
next_review: 2026-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Fair Lending, ECOA, FHA, HMDA, Reg B, Reg C, Reg Z, NCUA]
---

# Fair Lending Policy

## General Policy Statement

Pynthia Credit Union ("Pynthia" or "the Credit Union") is committed to providing equal access to credit for all creditworthy applicants and members, free from discrimination on any prohibited basis under the Equal Credit Opportunity Act and Regulation B ([12 CFR Part 1002](https://www.ecfr.gov/current/title-12/part-1002)), the Fair Housing Act ([42 U.S.C. § 3605](https://www.law.cornell.edu/uscode/text/42/3605)), NCUA Part 701.31 ([12 CFR § 701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31)), and related statutes. This policy governs every stage of the credit lifecycle — inquiry, application, evaluation, pricing, appraisal, action-taken notice, monitoring data collection, advertising, servicing, and record retention — and applies to all products, channels, and third parties acting on behalf of the Credit Union. The Chief Compliance Officer owns this policy; Lending Operations, Analytics, Third-Party Risk Management, Legal, HR, and Marketing are required participants. The Board receives fair-lending reporting at least quarterly.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Completed application — approve, counter, or deny | Application complete and decisioned (`loan_application.decisioned`) | 30 calendar days | Reg B §1002.9(a)(1) | [FL-05](#fl-05-action-taken-notices) |
| Incomplete application — adverse action | Application aged incomplete (`loan_application.incomplete.detected`) | 30 calendar days | Reg B §1002.9(a)(1)(ii) | [FL-05](#fl-05-action-taken-notices) |
| Existing-account adverse action | Account adverse action decided (`account.adverse_action.decided`) | 30 calendar days | Reg B §1002.9(a)(2) | [FL-05](#fl-05-action-taken-notices) |
| Counteroffer not accepted | Counteroffer expires unaccepted (`loan_application.counteroffer.expired`) | 90 calendar days | Reg B §1002.9(a)(1)(iv) | [FL-05](#fl-05-action-taken-notices) |
| Small-business phone credit (≤$1MM revenue) | Application decisioned by phone (`loan_application.decisioned`) | Reasonable time | Reg B §1002.9(a)(3) | [FL-05](#fl-05-action-taken-notices) |
| Appraisal/valuation copy delivery | Appraisal completed (`appraisal.completed`) | Promptly; no later than 3 BD before consummation | Reg B §1002.14(a)(1) | [FL-04](#fl-04-appraisal-independence--rov) |
| ROV outcome | ROV requested (`valuation.rov.requested`) | 15 calendar days | Reg B §1002.14; FFIEC guidance | [FL-04](#fl-04-appraisal-independence--rov) |
| GMI collection | HMDA-covered application created (`application.hmda_covered.created`) | At application | Reg C §1003.4 | [FL-06](#fl-06-government-monitoring-information--hmda) |
| Quarterly LAR QC | Quarter closes (`analytics.quarter.closed`) | Within 30 days of quarter close | Reg C §1003.4 | [FL-06](#fl-06-government-monitoring-information--hmda) |
| Annual LAR submission | Submission window opens (`hmda.submission_window_open`) | Per Reg C calendar (typically March 1) | Reg C §1003.5 | [FL-06](#fl-06-government-monitoring-information--hmda) |
| Pricing exception Compliance review | Month closes | By 10th of following month | Reg B §1002.6; FFIEC P1–P3 | [FL-03](#fl-03-evaluation--pricing-rules) |
| Quarterly disparity analytics | Quarter closes (`analytics.quarter.closed`) | Within 30 days of quarter close | FFIEC U1–U9, P1–P7 | [FL-10](#fl-10-monitoring--disparity-reviews) |
| Annual redlining review | Q1 opens | By end of Q1 | FFIEC R1–R12 | [FL-10](#fl-10-monitoring--disparity-reviews) |
| Third-party MI pack | 5th BD of each month | Monthly | ECOA §1002.4; FFIEC C5 | [FL-09](#fl-09-third-party-fair-lending-oversight) |
| Ad pre-flight checklist | Before any ad launch (`ad.preflight.submitted`) | Before launch | Reg Z §1026.24; FHA | [FL-07](#fl-07-advertising--fair-housing) |
| LO comp plan review | Plan submitted (`lo_comp.plan.submitted`) | Before implementation | Reg Z §1026.36(d),(e) | [FL-08](#fl-08-lo-compensation--anti-steering) |
| Fair-lending training — new hire | Employee hired (`employee.hired`) | Within 30 days of role start | FFIEC C7 | [FL-11](#fl-11-training) |
| Fair-lending training — annual | December 31 each year | December 31 | FFIEC C7 | [FL-11](#fl-11-training) |
| Complaint logged | Complaint received (any channel) | 1 BD | FFIEC U9, P5, S7, M7 | [FL-13](#fl-13-complaint-monitoring) |
| Prohibited-basis triage | Complaint logged (`complaint.logged`) | 3 BD | FFIEC Appendix §A–B | [FL-13](#fl-13-complaint-monitoring) |
| Initial Compliance assessment | Complaint escalated to Compliance | 10 BD | FFIEC Appendix §A–B | [FL-13](#fl-13-complaint-monitoring) |
| CCO escalation — High/Pattern complaint | Complaint classified High or Pattern | 2 BD | FFIEC Appendix §A–B | [FL-13](#fl-13-complaint-monitoring) |
| CAP initiation — complaint pattern | Pattern identified (3+ same-type in 12 months) | 30 calendar days | FFIEC Appendix §A–B | [FL-13](#fl-13-complaint-monitoring) |

---

## FL-01 — Prohibition & Protected Bases {#fl-01-prohibition--protected-bases}

**WHY (Reg cite):** ECOA/Reg B [§1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4) prohibits discrimination in any aspect of a credit transaction on any prohibited basis. The Fair Housing Act [42 U.S.C. § 3605](https://www.law.cornell.edu/uscode/text/42/3605) extends this prohibition to residential real-estate-related transactions. NCUA [12 CFR § 701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31) imposes parallel nondiscrimination requirements on federal credit unions. The FFIEC Interagency Fair Lending Examination Procedures (Overt risk factors O1–O5; Compliance Management Analysis Checklist §A.1b–c) require that institutions communicate the prohibition explicitly to all staff and prohibit inquiry-stage discouragement.

**SYSTEM BEHAVIOR:** The system enforces a Compliance-maintained list of protected traits and proxy guardrails (`compliance.guarded_attributes`, `compliance.guardrails`). No underwriting, pricing, or decisioning workflow may reference a protected trait or a registered proxy (e.g., ZIP code used as a racial surrogate, property age or location used as a neighborhood-characteristic proxy) at any stage. Staff are explicitly prohibited from discouraging inquiries or applications on a prohibited basis through oral statements, delays, differential referrals, selective product disclosure, or any other means (FFIEC Checklist §A.1c; risk factors O4–O5). Any suspected inquiry-stage discouragement must be reported immediately to Compliance via the Fair-Lending Issue Register; Compliance must assess and escalate within two business days. The protected-trait list and proxy guardrails are write-restricted to Compliance; changes require CCO approval and trigger `compliance.guarded_attributes.updated`. Annual policy review and quarterly Board reporting are required. Disparate impact is evaluated under the business-necessity standard; unjustified disparate impact is a violation even absent discriminatory intent.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Compliance updates the protected-trait list or proxy guardrails (`compliance.guarded_attributes.updated`) | Updated trait list (`compliance.guarded_attributes`), proxy guardrail definitions (`compliance.guardrails`), CCO approval record | Updated guardrail configuration published to all decisioning systems (`compliance.guardrails.published`) | Immediately on change |
| Staff reports suspected inquiry-stage discouragement (`fair_lending.discouragement.reported`) | Description of conduct (`incident.description`), reporter identity (`escalation.reporter_id`), severity assessment (`escalation.severity`) | Fair-Lending Issue Register entry (`fair_lending.record_appended`); escalation to Compliance (`escalation.created`) | Report: immediately; Compliance assessment: 2 BD (enforced by `fair_lending.remediation_due_at`) |
| Annual policy review cycle opens | Current policy version (`policy.document_version`), prior-year Board report, any regulatory changes | Revised policy submitted for Board approval (`policy.board_review`); Board approval recorded (`policy.board.approved`) | Annual; next review: 2026-07-01 |
| Quarterly Board reporting cycle | Disparity analytics summary, complaint pattern summary, exception data, corrective action status | Board compliance report delivered (`compliance.board_report.delivered`) | Within 30 days of quarter close (enforced by `compliance.board_report_due_at`) |

**ALERTS/METRICS:** Alert if any decisioning workflow references a field on the guarded-attributes list (target: zero occurrences). Alert if a discouragement report is not assessed by Compliance within 2 BD. Board report delivery tracked against `compliance.board_report_due_at`; aging alert at T+25 days.

---

## FL-02 — Permissible Inquiries {#fl-02-permissible-inquiries}

**WHY (Reg cite):** Reg B [§1002.5](https://www.ecfr.gov/current/title-12/part-1002#p-1002.5) specifies which information a creditor may and may not request in connection with a credit application, including restrictions on inquiries about marital status, sex, childbearing, and immigration status. [§1002.13](https://www.ecfr.gov/current/title-12/part-1002#p-1002.13) requires collection of government monitoring information for certain dwelling-secured applications. FFIEC Checklist §A.1b requires that training and application-processing aids correctly describe these requirements.

**SYSTEM BEHAVIOR:** Application forms are configured to collect only permissible fields. Required disclosures (e.g., the optional-designation notice for title fields, the GMI collection notice) are presented before any sensitive field is rendered. The system blocks submission if a required disclosure has not been acknowledged. Marital-status inquiries are limited to "married," "unmarried," and "separated" for non-individual-unsecured credit; the field is suppressed for individual unsecured credit unless the applicant resides in a community property state. Sex inquiries are prohibited except as part of GMI collection under §1002.13. Childbearing and birth-control inquiries are blocked at the form level. Immigration-status inquiries are permitted; national-origin inquiries are not. Spouse information may be collected only under the four conditions in §1002.5(c)(2). Application form templates are write-restricted to Compliance and require CCO sign-off before deployment. The target is 100% of applications with required disclosures presented before sensitive fields are collected.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Application form rendered to applicant (`application.form.rendered`) | Form template version (`loan_application.product_code`), applicant credit type (individual unsecured vs. other), state of residence | Required disclosures presented before sensitive fields (`application.disclosures.presented`); form render logged | Before any sensitive field is displayed |
| Application submitted (`loan_application.completed`) | Completed application data, disclosure acknowledgment record | Disclosure compliance check result logged; application proceeds to evaluation or is flagged for remediation | At submission |
| Form template change proposed | Redlined template, Compliance review, CCO approval | Form template approved (`form.template.approved`); prior version archived | Before deployment |

**ALERTS/METRICS:** Alert if any application is submitted without a disclosure-acknowledgment record (target: zero). Monitor form-template deployment events; alert on any deployment without a recorded CCO approval. Quarterly audit of a random sample of submitted applications to confirm disclosure sequencing.

---

## FL-03 — Evaluation & Pricing Rules {#fl-03-evaluation--pricing-rules}

**WHY (Reg cite):** Reg B [§1002.6](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6) governs the criteria a creditor may use in evaluating creditworthiness, prohibiting negative factors for elderly applicants and requiring equal treatment of public-assistance income. [§1002.6(b)(2)](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6(b)(2)) requires that credit scoring systems be empirically derived, demonstrably and statistically sound (EDDSS). FFIEC risk factors U4–U7 (vague criteria, lack of exception guidance, high exception rates) and P1–P3 (financial incentives, broad pricing discretion, non-objective risk-based pricing) are the primary examiner focal points for this control.

**SYSTEM BEHAVIOR:** All underwriting uses either a validated EDDSS scoring model (governed by the Model Risk Management Program) or documented judgmental criteria with objective, written standards. The system blocks assignment of a negative factor or value to an applicant solely because of age (§1002.6(b)(2)); elderly applicants (age ≥ 62) may not receive a less-favorable score than the most-favored age group below 62. Public-assistance income is treated identically to other income sources in all income-calculation fields. Pricing deviations from the rate sheet require a documented exception with a legitimate, non-prohibited-basis rationale captured in `pricing.exception_rationale` and approved by a designated authority. Compliance reviews all pricing exceptions by the 10th of the following month. Exception data is segmented by loan officer, branch, product, and applicant demographics for disparity analysis. Compliance is write-restricted to the exception-approval workflow; loan officers may not self-approve exceptions.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Pricing exception requested (`pricing.exception.requested`) | Proposed price (`pricing.proposed_price`), sheet price (`pricing.sheet_price`), exception rationale (`pricing.exception_rationale`), applicant demographics summary (`pricing.exception_demographics_summary`) | Exception case opened; pending approval logged (`pricing.exception.requested`) | At time of request; approval required before rate lock |
| Pricing exception decided (`pricing.exception.decided`) | Approver identity (`pricing.exception_approver`), rationale adequacy determination | Exception decision recorded (`pricing.exception.decided`); rate lock permitted or blocked | Before loan closing |
| Monthly exception review by Compliance (`pricing.exception_review.completed`) | All exceptions for the period (`pricing.exception_period`), demographics summary, disparity flags | Exception review completed and logged (`pricing.exception_review.completed`); findings routed to FL-10 disparity analytics | By 10th of following month (enforced by `pricing.exception_review_due_at`) |
| Scoring model revalidation triggered | Model performance data, EDDSS documentation, validation report | Model review completed (`model.review.completed`); updated model approved before production use | Per Model Risk Management Program schedule |

**ALERTS/METRICS:** Alert if any exception is approved without a documented rationale (target: zero). Alert if the monthly exception review is not completed by the 10th (enforced by `pricing.exception_review_due_at`). Track exception rate by loan officer and branch; alert if any individual's exception rate exceeds the institution average by a statistically significant margin.

---

## FL-04 — Appraisal Independence & ROV {#fl-04-appraisal-independence--rov}

**WHY (Reg cite):** Reg B [§1002.14](https://www.ecfr.gov/current/title-12/part-1002#p-1002.14) requires creditors to provide applicants a copy of appraisals and written valuations promptly and no later than three business days before consummation, and to disclose the right to receive copies at application. Interagency appraisal-independence rules (12 CFR Part 1026, Appendix; NCUA guidance) prohibit production staff from influencing valuation outcomes. The Fair Housing Act [42 U.S.C. § 3605](https://www.law.cornell.edu/uscode/text/42/3605) prohibits discriminatory appraisal practices. FFIEC Checklist §A.1c requires procedures to prevent differential appraisal practices on a prohibited basis.

**SYSTEM BEHAVIOR:** Valuation staff are organizationally separated from loan production; the system enforces this by restricting appraisal-order assignment (`appraisal.order.logged`) to a Compliance-approved appraiser panel and blocking production staff from communicating with appraisers outside the documented channel. The applicant's right to receive appraisal copies is disclosed at application (`valuation.rights_disclosure.sent`). Appraisal copies are delivered automatically upon completion, no later than three business days before consummation (`appraisal.copy.delivered`). A reconsideration-of-value (ROV) pathway is available to all applicants; ROV requests are logged, reviewed by a Compliance-approved reviewer independent of the original appraiser, and decided within 15 calendar days of receipt. ROV outcomes (upheld, revised, withdrawn) are logged in the Fair-Lending Issue Register for pattern analysis. Appraisals that reference neighborhood racial or ethnic composition, property location as a proxy for prohibited characteristics, or other biased factors are flagged by the bias-screen rules (`valuation.bias_screen_rules`) and escalated to Compliance before use. Production staff are write-restricted from the ROV decision workflow.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| First-lien dwelling application created (`application.first_lien.created`) | Application ID, product type | Appraisal rights disclosure sent to applicant (`valuation.rights_disclosure.sent`) | At application |
| Appraisal ordered (`appraisal.ordered`) | Approved appraiser panel, property address, loan application ID | Appraisal order logged (`appraisal.order.logged`); production-staff access to appraiser blocked | At order |
| Appraisal completed (`appraisal.completed`) | Completed appraisal report (`appraisal.document`), bias-screen result (`valuation.bias_screen_rules`) | Appraisal copy delivered to applicant (`appraisal.copy.delivered`); bias-screen result logged | Promptly; no later than 3 BD before consummation (enforced by `appraisal.delivery_due_at`) |
| ROV requested by applicant (`valuation.rov.requested`) | ROV request details, original appraisal, applicant identity | ROV case opened; independent reviewer assigned; outcome logged (`valuation.rov.decided`) | Decision within 15 calendar days (enforced by `valuation.rov_due_at`) |

**ALERTS/METRICS:** Alert if appraisal copy delivery is not confirmed at least 3 BD before consummation (target: zero late deliveries). Alert if ROV decision exceeds 15 calendar days (`valuation.rov_due_at`). Track ROV outcomes quarterly; a pattern of upheld appraisals with bias-screen flags triggers a Compliance review.

---

## FL-05 — Action-Taken Notices {#fl-05-action-taken-notices}

**WHY (Reg cite):** Reg B [§1002.9](https://www.ecfr.gov/current/title-12/part-1002#p-1002.9) requires creditors to notify applicants of action taken within specified timeframes and to provide specific reasons for adverse action. [§1002.9(a)(2)](https://www.ecfr.gov/current/title-12/part-1002#p-1002.9(a)(2)) covers existing-account adverse actions. The Fair Credit Reporting Act [15 U.S.C. § 1681m](https://www.law.cornell.edu/uscode/text/15/1681m) requires a credit-score disclosure block when a score is used in adverse action. FFIEC Checklist §A.1a requires that denial reasons be accurately and promptly communicated.

**SYSTEM BEHAVIOR:** The system automatically generates and queues an adverse action notice (AAN) upon any adverse decisioning event. The AAN includes specific reasons (not general statements), the ECOA notice, and — when a credit score was used — the score disclosure block (`decision.score_block`) as required by FCRA §615. Notices are delivered via the applicant's preferred channel. A counteroffer accepted within 90 days of issuance requires no AAN; if the counteroffer expires unaccepted, the system automatically issues an AAN within the 90-day window. For small-business phone credit (applicant revenue ≤ $1MM, `applicant.business_revenue_tier`), the system flags the application for "reasonable time" notice and alerts Compliance if no notice is issued within 30 days. The target on-time rate is ≥ 99.5% with zero regulatory-deadline breaches. The AAN workflow is write-restricted to the Compliance-approved notice template; loan officers may not modify notice content.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Completed application decisioned adversely (`loan_application.adverse_action.decided`) | Applicant identity (`loan_party.identity`), decision basis (`loan_application.action_basis`), reason codes (`loan_application.adverse_action`), score block if applicable (`decision.score_block`) | AAN with specific reasons + ECOA notice + score block (if applicable) queued (`aan.queued`); AAN issued (`aan.issued`) | 30 calendar days (enforced by `loan_application.aan_due_at`) |
| Incomplete application aged without completion (`loan_application.incomplete.detected`) | Application ID, incompleteness reason (`loan_application.incompleteness_notice`) | Incompleteness notice or AAN issued (`notice.incompleteness.sent` or `aan.issued`) | 30 calendar days (enforced by `application.notice_due_at`) |
| Existing-account adverse action decided (`account.adverse_action.decided`) | Account ID, action basis (`account.adverse_action`), reason codes | AAN issued (`aan.issued`) | 30 calendar days (enforced by `loan_account.aan_due_at`) |
| Counteroffer issued and not accepted within 90 days (`loan_application.counteroffer.expired`) | Counteroffer terms (`loan_application.counteroffer_terms`), counteroffer status (`loan_application.counteroffer_status`) | AAN issued automatically (`aan.issued`) | 90 calendar days from counteroffer date (enforced by `loan_application.counteroffer_aan_due_at`) |
| Small-business phone credit application decisioned (`loan_application.decisioned`) | Business revenue tier (`applicant.business_revenue_tier` = ≤$1MM), oral adverse decision flag (`loan_application.oral_adverse_decision`) | Oral notice logged (`notice.oral.logged`); written AAN queued if requested | Reasonable time; Compliance alert if >30 days |

**ALERTS/METRICS:** Real-time aging alert when any AAN is within 5 BD of its regulatory deadline. Dashboard metric: on-time AAN rate (target ≥ 99.5%); zero-breach target enforced by `loan_application.aan_due_at` and `loan_account.aan_due_at`. Monthly Compliance review of all late or missing AANs.

---

## FL-06 — Government Monitoring Information & HMDA {#fl-06-government-monitoring-information--hmda}

**WHY (Reg cite):** Reg B [§1002.13](https://www.ecfr.gov/current/title-12/part-1002#p-1002.13) requires collection of government monitoring information (GMI) for applications for credit primarily to purchase or refinance a dwelling secured by the dwelling. Reg C [12 CFR Part 1003](https://www.ecfr.gov/current/title-12/part-1003), specifically [§1003.4](https://www.ecfr.gov/current/title-12/part-1003#p-1003.4), governs LAR data fields, collection methodology, and submission. FFIEC risk factor C2 (monitoring information nonexistent or incomplete) and Checklist §A.1b are the primary examiner focal points.

**SYSTEM BEHAVIOR:** For every HMDA-covered application (`application.hmda_covered`), the system presents the GMI collection screen at application with the required disclosure that the information is requested for federal monitoring purposes, that the applicant is not required to provide it, and that the Credit Union is prohibited from discriminating on the basis of this information. If the applicant declines to provide GMI, the system records the declination and — for face-to-face applications — applies the visual observation/surname rule as required by §1003.4(a)(10)(i). GMI responses are stored in `applicant.gmi_responses` and `loan_application.gmi`, and are logically separated from the credit file. LAR rows are recorded at final action (`hmda.lar_row.recorded`). Quarterly LAR QC is performed within 30 days of quarter close; the annual LAR is submitted per the Reg C calendar. LAR data is write-restricted to the HMDA Compliance function; corrections require documented justification.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| HMDA-covered application created (`application.hmda_covered.created`) | Application ID, product type, dwelling-secured flag (`application.first_lien`) | GMI collection screen presented with required disclosure (`application.disclosures.presented`); GMI responses recorded (`hmda.gmi.recorded`) | At application |
| Final action taken on HMDA-covered application (`application.final_action.recorded`) | Final action code, GMI data (`loan_application.gmi`), geography (`loan_application.geography`), loan amount (`loan_application.amount`) | LAR row recorded (`hmda.lar_row.recorded`) | Within 30 days of final action |
| Quarter closes (`analytics.quarter.closed`) | LAR rows for the quarter, QC sampling plan | Quarterly LAR QC completed (`hmda.lar_qc.completed`); errors corrected and documented | Within 30 days of quarter close (enforced by `hmda.lar_qc_due_at`) |
| Annual submission window opens (`hmda.submission_window_open`) | Final LAR (`hmda.hmda_lar`), QC sign-off | LAR submitted to CFPB/NCUA (`hmda.lar.submitted`) | Per Reg C calendar (typically March 1; enforced by `hmda.submission_due_at`) |

**ALERTS/METRICS:** Alert if any HMDA-covered application reaches final action without a LAR row recorded (target: zero gaps). Alert if quarterly QC is not completed within 30 days of quarter close. Track LAR error rate from QC; a rate above 5% triggers a root-cause review and retraining.

---

## FL-07 — Advertising & Fair Housing {#fl-07-advertising--fair-housing}

**WHY (Reg cite):** Reg Z [§1026.24](https://www.ecfr.gov/current/title-12/part-1026#p-1026.24) governs trigger-term disclosures and APR prominence in credit advertising. The Fair Housing Act [42 U.S.C. § 3605](https://www.law.cornell.edu/uscode/text/42/3605) and HUD regulations [24 CFR Part 100](https://www.ecfr.gov/current/title-24/part-100) require the Equal Housing Lender legend on real-estate-related advertising and prohibit exclusionary marketing. The ADA [28 CFR Part 36](https://www.ecfr.gov/current/title-28/part-36) requires reasonable accommodations in digital marketing and application flows. FFIEC risk factors M1–M7 and Checklist §A.1e govern marketing discrimination analysis.

**SYSTEM BEHAVIOR:** Pynthia does not currently anticipate significant consumer advertising; however, these controls are always-on requirements that apply at any volume and scale with advertising activity. Every advertisement — regardless of volume — must complete a pre-flight checklist (`ad.preflight`) before launch; the checklist confirms trigger-term disclosures, APR prominence, Fair Housing legend inclusion (for real-estate ads), absence of exclusionary language or code words, and ADA/accessibility compliance for digital formats. The pre-flight checklist is approved by Compliance before any ad is published (`ad.preflight.decided`). Geo-targeting parameters are screened to confirm they do not systematically exclude census tracts or ZIP codes with disproportionately high minority-group concentrations relative to the institution's market area (`ad.targeting_screen.completed`). Digital marketing and application flows must meet WCAG 2.1 AA accessibility standards; accessibility checks are logged (`ad.accessibility_check`). Any advertising program is assessed periodically (at least annually, or upon material change) to confirm it is not systematically excluding prohibited-basis group members from the institution's market, including review of media selection, geo-targeting, and intermediary relationships (`advertising.reach_review.completed`). The target is 100% of ads with a completed and approved pre-flight checklist. Marketing is write-restricted from publishing any ad without a recorded Compliance approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Ad pre-flight checklist submitted (`ad.preflight.submitted`) | Ad creative (`ad.creative`), audience definition (`ad.audience_definition`), targeting parameters (`ad.targeting_screen`), accessibility check result (`ad.accessibility_check`), medium | Pre-flight decided by Compliance (`ad.preflight.decided`); approval or rejection logged | Before launch |
| Ad targeting parameters changed (`ad.targeting.changed`) | Updated geo-targeting parameters, minority-concentration data for affected geographies | Targeting screen completed (`ad.targeting_screen.completed`); exclusionary targeting blocked | Before change takes effect |
| Ad published (`advertising.published`) | Approved pre-flight ID (`advertising.approval_id`), medium (`advertising.medium`), publication record | Publication logged (`advertising.publication.logged`) | At publication |
| Annual (or material-change) marketing reach review (`advertising.reach_review.completed`) | Media selection data, geo-targeting history, intermediary relationships, demographic reach data | Reach review completed and logged (`advertising.reach_review.completed`); findings reported to Compliance | Annually or upon material change (enforced by `advertising.reach_review_due`) |

**ALERTS/METRICS:** Alert if any ad is published without a recorded Compliance pre-flight approval (target: zero). Alert if the annual reach review is overdue (`advertising.reach_review_due`). Track accessibility check failures; any failure blocks publication until remediated.

---

## FL-08 — LO Compensation & Anti-Steering {#fl-08-lo-compensation--anti-steering}

**WHY (Reg cite):** Reg Z [§1026.36(d)](https://www.ecfr.gov/current/title-12/part-1026#p-1026.36(d)) prohibits loan originator compensation based on loan terms or proxies for loan terms. [§1026.36(e)](https://www.ecfr.gov/current/title-12/part-1026#p-1026.36(e)) prohibits steering consumers to products that are not in their interest when the consumer qualifies for a more favorable product. FFIEC risk factors S1–S8 and P1–P2 are the primary examiner focal points. FFIEC Checklist §A.1e requires procedures to prevent financial incentives for placing applicants in nontraditional or higher-cost products.

**SYSTEM BEHAVIOR:** LO compensation plans are reviewed and approved by Compliance before implementation (`lo_comp.plan.decided`). The system blocks any compensation structure that ties LO pay to loan terms (interest rate, points, fees, APR) or to proxies for loan terms. Before loan finalization, the system requires documentation that the applicant was presented with meaningful alternatives: the option with the lowest rate, the option with the lowest fees, and the option with the lowest total cost (`application.options.presented`). If fewer than three eligible product options exist for a given applicant, a Compliance waiver is required before finalization (`application.option_waiver.decided`); the reason for the shortfall is documented (`loan_application.option_shortfall_reason`). Steering to a higher-cost or nontraditional product when the applicant qualifies for a more favorable product is blocked at the system level. The LO comp plan and the option-presentation workflow are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| LO compensation plan submitted for review (`lo_comp.plan.submitted`) | Plan terms (`lo_comp.plan_terms`), basis analysis confirming no term-based compensation (`lo_comp.basis_analysis`) | Plan decided by Compliance (`lo_comp.plan.decided`); approved plan recorded | Before implementation |
| Application reaches option-selection stage (`application.option_selection.started`) | Eligible product options, applicant qualification data, rate sheet (`rate_sheet.apor_values`) | Options presented to applicant (`application.options.presented`); selection logged | Before rate lock or commitment |
| Fewer than three eligible options detected (`application.option_shortfall.detected`) | Reason for shortfall (`loan_application.option_shortfall_reason`), available options | Option shortfall flagged; Compliance waiver required (`application.option_waiver.decided`) | Before finalization; waiver must be obtained before closing |
| Steering review completed (`steering_review.completed`) | Product placement data, LO compensation data, prohibited-basis demographics | Steering review result logged (`steering_review.completed`); findings routed to FL-10 | Quarterly (enforced by `steering_review.due`) |

**ALERTS/METRICS:** Alert if any loan is finalized without a recorded option-presentation event (target: zero). Alert if a Compliance waiver for option shortfall is not obtained before closing. Track option-shortfall rate by LO and product; a rate above the institution average triggers a Compliance review.

---

## FL-09 — Third-Party Fair-Lending Oversight {#fl-09-third-party-fair-lending-oversight}

**WHY (Reg cite):** ECOA/Reg B [§1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4) makes the creditor liable for fair-lending violations by third parties acting on its behalf. FFIEC risk factor C5 (compliance management program inferior to peer institutions) and Checklist §A.1a require that institutions monitor third-party conduct. FFIEC Part I (Understanding Credit Operations) requires evaluation of broker and third-party activity for underwriting, pricing, steering, and redlining risk.

**SYSTEM BEHAVIOR:** All third-party vendors with a fair-lending nexus (brokers, correspondents, marketing intermediaries, appraisers) undergo fair-lending due diligence at onboarding (`vendor.fl_dd.completed`) and annually thereafter. Vendor contracts include fair-lending compliance representations and audit-rights clauses. Each covered third party submits a monthly Fair-Lending MI pack by the 5th business day of the following month (`vendor.mi_due_at`), containing: application volume, approval/denial rates, pricing data, exception counts, and fair-lending complaints. Compliance reviews the MI pack and flags anomalies. If a third party's MI pack reveals a disparity or pattern of concern, Compliance issues a corrective action plan (CAP) and tracks it to closure (`vendor.cap`). Persistent non-compliance or failure to submit the MI pack triggers escalation to the CCO and, if unresolved, contract termination. Third-Party Risk Management is the operational owner of vendor onboarding mechanics (see Third-Party Risk Policy); this control governs only the fair-lending-specific due diligence and MI requirements. Compliance is write-restricted to the CAP issuance workflow.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New third party with fair-lending nexus onboarded (`vendor.onboarding.started`) | Due diligence package (`vendor.dd_package`), fair-lending DD checklist (`vendor.fl_dd`), contract fair-lending clauses | Fair-lending DD completed (`vendor.fl_dd.completed`); onboarding approved or blocked | Before go-live |
| Monthly MI pack due from third party | Applications, approvals, pricing, exceptions, complaints for the period (`vendor.mi_pack`) | MI pack received and reviewed; anomalies flagged (`vendor.mi.reviewed`); MI breach detected if not received (`vendor.mi_breach.detected`) | By 5th BD of following month (enforced by `vendor.mi_due_at`) |
| MI pack anomaly or disparity identified (`vendor.mi_breach.detected`) | MI pack data, prior-period comparison, disparity threshold | CAP issued to third party (`vendor.cap.issued`); CAP tracked to closure | CAP issued within 10 BD of detection; closure tracked monthly |
| Annual third-party fair-lending review | Prior-year MI packs, DD file, contract terms | Annual review completed (`vendor.review.completed`); findings reported to Compliance | Annually (enforced by `vendor.annual_review_due`) |

**ALERTS/METRICS:** Alert if any covered third party fails to submit the monthly MI pack by the 5th BD (target: zero late submissions). Alert if a CAP is open for more than 60 days without documented progress. Track third-party disparity metrics alongside internal metrics in the quarterly FL-10 disparity report.

---

## FL-10 — Monitoring & Disparity Reviews {#fl-10-monitoring--disparity-reviews}

**WHY (Reg cite):** ECOA/Reg B [§1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4) and the Fair Housing Act [42 U.S.C. § 3605](https://www.law.cornell.edu/uscode/text/42/3605) require ongoing compliance. FFIEC risk factors U1–U9 (underwriting disparities), P1–P7 (pricing disparities), R1–R12 (redlining), and S1–S8 (steering) define the examiner's analytical framework. FFIEC Part III.G provides the six-step comparative redlining analysis methodology that this control implements. FFIEC Checklist §A.2 (self-evaluation/self-test) and §B (corrective measures) require documented disparity analysis and corrective action.

**SYSTEM BEHAVIOR:** Compliance runs quarterly disparity analytics within 30 days of each quarter close, covering: application rates, approval/denial rates, pricing (rate, points, fees), loan terms, exception rates, and withdrawal/incompleteness rates — all segmented by prohibited basis (race, sex, national origin, age, familial status, disability, public-assistance income) and by loan officer, branch, product, and geography (`analytics.disparity_report`). Disparity deltas beyond defined thresholds [THRESHOLD NEEDED — flag as pre-exam priority; Compliance must define thresholds before the next examination cycle] trigger a corrective action plan (CAP) within 30 days of identification (`analytics.cap.opened`). The annual redlining review is completed by end of Q1 and covers: (1) the Credit Union's CRA assessment area and reasonably expected market area; (2) census-tract-level lending distribution segmented by minority-concentration quartile (0–25%, 25–50%, 50–75%, >75%); (3) peer comparison data (HMDA aggregate data for similarly situated institutions in the same MSA); (4) the six-step FFIEC comparative analysis framework (FFIEC Part III.G): identify minority areas → determine whether they are excluded or underserved → identify non-minority areas treated more favorably → identify minority areas just outside the assessment area → obtain and evaluate the institution's explanation → evaluate supporting or contradicting information; (5) marketing and branch-distribution analysis for the assessment area. The quarterly disparity report and annual redlining review are presented to the Board. All analytics datasets are write-restricted to the Analytics function; methodology changes require Compliance approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter closes (`analytics.quarter.closed`) | LAR data, pricing data, exception data, third-party MI packs, complaint pattern summary | Quarterly disparity report completed (`analytics.disparity_report.completed`); Board report section prepared | Within 30 days of quarter close (enforced by `analytics.disparity_due_at`) |
| Disparity threshold breached (`analytics.threshold.breached`) | Disparity metric, threshold definition [THRESHOLD NEEDED], affected segment | CAP opened (`analytics.cap.opened`); CAP assigned to responsible owner; Board notified at next quarterly cycle | CAP initiated within 30 days of identification |
| Q1 opens (annual redlining review) | CRA assessment area data, HMDA LAR, census-tract minority-concentration data, peer HMDA data, marketing and branch data | Redlining review completed (`analytics.redlining_review.completed`); six-step analysis documented; findings reported to Board | By end of Q1 (enforced by `analytics.redlining_due_at`) |
| CAP item completed (`cap.item.completed`) | Remediation evidence, retest results | CAP retest verified (`cap.retest.verified`); CAP closed if all items complete | Per CAP timeline; tracked monthly |

**ALERTS/METRICS:** Alert if quarterly disparity report is not completed within 30 days of quarter close (`analytics.disparity_due_at`). Alert if annual redlining review is not completed by end of Q1 (`analytics.redlining_due_at`). Track open CAPs; alert if any CAP item is overdue. [THRESHOLD NEEDED] — disparity thresholds for CAP triggers must be defined by Compliance before the next examination cycle and documented in `compliance.disparity_thresholds`.

---

## FL-11 — Training {#fl-11-training}

**WHY (Reg cite):** FFIEC risk factor C7 (fair-lending training nonexistent or weak) and Checklist §A.1b require that training correctly and adequately describe prohibited bases, substantive Reg B requirements, and the institution's fair-lending policies. Reg B [§1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4) and the Fair Housing Act [42 U.S.C. § 3605](https://www.law.cornell.edu/uscode/text/42/3605) impose the underlying compliance obligations that training must support.

**SYSTEM BEHAVIOR:** Role-based fair-lending training is assigned to all employees, contractors, and covered third-party personnel within 30 days of role start (`training.onboarding_due_at`) and annually by December 31 (`training.annual_due_at`). Training content is role-differentiated: front-line staff receive inquiry-stage and application-processing modules; underwriters receive evaluation, pricing, and exception modules; management receives disparity analytics and Board-reporting modules. Training is refreshed whenever a material regulatory change or new product is introduced (`training.content_trigger.detected`). Completion is tracked to ≥ 98% of the covered population. Incomplete training triggers an escalation to the employee's manager and HR. Training records are retained per the record-retention schedule in FL-12. The training curriculum is write-restricted to Compliance and HR; content changes require CCO approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Employee hired or role changed to a covered role (`employee.hired`) | Employee ID, role (`user.role`), hire date (`training_detail.hire_date`), role curriculum (`training.role_curriculum`) | Training assignment created (`training.assignment.created`); onboarding training due date set | Within 30 days of role start (enforced by `training.onboarding_due_at`) |
| Annual training cycle opens | Covered population roster, annual curriculum version (`training.content_version`) | Annual training assigned to all covered personnel (`training.annual.assigned`) | By December 1 each year; completion required by December 31 (enforced by `training.annual_due_at`) |
| Training completed (`training.completed`) | Completion record, assessment score (`training.assessment_score`), assignee ID (`training.assignee_id`) | Completion recorded (`training.completion.recorded`); coverage percentage updated | At completion |
| Material regulatory change or new product detected (`training.content_trigger.detected`) | Change description, affected roles, updated curriculum | Refresher training issued (`training.refresh.issued`); completion tracked | Within 60 days of change |

**ALERTS/METRICS:** Alert if onboarding training is not completed within 30 days of role start. Alert if annual training completion rate falls below 98% as of December 31. Track completion by role, department, and third-party partner; report to Board quarterly.

---

## FL-12 — Record Retention {#fl-12-record-retention}

**WHY (Reg cite):** Reg B [§1002.12](https://www.ecfr.gov/current/title-12/part-1002#p-1002.12) specifies retention periods for credit applications, adverse action notices, and related records. Reg C [12 CFR Part 1003](https://www.ecfr.gov/current/title-12/part-1003) governs HMDA/LAR retention. Reg Z [§1026.36](https://www.ecfr.gov/current/title-12/part-1026#p-1026.36) governs LO compensation record retention. Reg B [§1002.15](https://www.ecfr.gov/current/title-12/part-1002#p-1002.15) provides a privilege for self-test records. All retention clocks are extended on litigation or investigation hold (see SC-02).

**SYSTEM BEHAVIOR:** The system assigns a retention class and clock to each fair-lending record at the moment of final action or record creation. The retention schedule by record class is:

| Record Class | Retention Period | Clock Anchor |
|---|---|---|
| Consumer credit application, adverse action notice, evaluation data | 25 months | Date of notice of action taken |
| Existing-account adverse action | 25 months | Date of adverse action |
| Business credit ≤ $1MM revenue | 12 months | Date of action taken |
| Business credit > $1MM — no reasons requested or retention not requested | 60 days | Date of action taken |
| Business credit > $1MM — reasons or retention requested | 12 months | Date of request |
| HMDA/GMI data and LAR | Per Reg C calendar (3 years after submission) | Date of submission |
| LO compensation records | Per Reg Z §1026.36 (3 years) | Date of compensation event |
| Self-test records (privileged) | 25 months | Date of self-test completion |
| Prescreened solicitation records | 25 months | Date of solicitation |

Self-test records are flagged with `document.legal_hold_flag = true` (privilege flag) and are not disclosed to examiners unless the Credit Union voluntarily waives privilege. All retention clocks are suspended on litigation or investigation hold; see SC-02 for lifecycle mechanics. Compliance is write-restricted to the retention-schedule configuration.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Final action taken on any credit application (`application.final_action.recorded`) | Record class, action date, applicant type (consumer vs. business), revenue tier (`applicant.business_revenue_tier`), reasons-requested flag | Retention clock set (`record.retention_clock_set`); retention class and expiry date assigned (`record.retention_class`, `record.retention_expires_at`) | At final action |
| Self-test completed | Self-test report, privilege election | Self-test record flagged as privileged (`document.legal_hold_flag`); retention clock set to 25 months | At completion |
| Litigation or investigation hold placed | Hold scope, matter ID | Retention clock suspended; legal hold flag set (`record.legal_hold.placed`) — see SC-02 | Immediately on hold placement |

**ALERTS/METRICS:** Alert if any record reaches its retention expiry without a destruction or hold decision (see SC-02). Alert if a self-test record is disclosed to an examiner without a recorded privilege-waiver decision. Track retention-clock-set events against final-action events; gap of zero is the target.

---

## SC-02 — Record-Retention Lifecycle Mechanics {#sc-02-record-retention-lifecycle-mechanics}

**WHY (Reg cite):** Reg B [§1002.12](https://www.ecfr.gov/current/title-12/part-1002#p-1002.12) and the general record-retention framework require that records be preserved for their full retention period and destroyed only after that period expires (absent a hold). Legal-hold obligations arise under federal common law and agency examination authority. NCUA examination authority requires that records subject to an open examination or investigation not be destroyed.

**SYSTEM BEHAVIOR:** When a retention clock expires (`record.retention.expired`), the system evaluates whether a legal hold is active (`record.legal_hold_flag`). If no hold is active and the record is not flagged as permanent, the system schedules destruction (`disposal.scheduled`) and executes it after a 10-BD confirmation window (`disposal.executed`), logging a destruction certificate (`disposal.certificate.recorded`). If a legal hold is active, destruction is blocked and the record remains in hold status until the hold is released (`record.hold.released`) and the retention clock is re-evaluated. Permanent records (flagged `record.disposal_eligible = false`) are never scheduled for destruction. Legal holds are placed by Legal or Compliance (`legal.hold.placed`) and released only with documented authorization (`legal.hold.released`). All destruction events are logged in the destruction log (`destruction_log.entry.created`). Compliance is write-restricted to the hold-placement and hold-release workflows.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Retention clock expires (`record.retention.expired`) | Record ID, retention class (`record.retention_class`), legal hold flag (`record.legal_hold_flag`), permanent flag (`record.disposal_eligible`) | If no hold and not permanent: destruction scheduled (`disposal.scheduled`); if hold active: destruction blocked and hold status confirmed | Evaluation: immediately on expiry; destruction: after 10-BD confirmation window |
| Legal hold placed (`legal.hold.placed`) | Matter ID (`legal.matter_id`), hold scope (`legal.hold_scope`), authorizer | Hold flag set on all in-scope records (`record.hold.applied`); destruction clock suspended | Immediately |
| Legal hold released (`legal.hold.released`) | Matter ID, release authorization (`legal.hold_release_auth`) | Hold flag cleared (`record.hold.released`); retention clock re-evaluated; destruction rescheduled if clock has expired | Within 5 BD of release authorization |
| Destruction executed (`disposal.executed`) | Destruction method (`disposal.method`), batch manifest | Destruction certificate recorded (`disposal.certificate.recorded`); destruction log entry created (`destruction_log.entry.created`) | At execution |

**ALERTS/METRICS:** Alert if any record reaches retention expiry without a destruction or hold decision within 10 BD. Alert if a destruction event occurs without a corresponding destruction certificate. Track open legal holds monthly; alert if any hold has been open for more than 24 months without a status review.

---

## FL-13 — Complaint Monitoring {#fl-13-complaint-monitoring}

**WHY (Reg cite):** ECOA/Reg B [§1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4) and the Fair Housing Act [42 U.S.C. § 3605](https://www.law.cornell.edu/uscode/text/42/3605) impose the underlying nondiscrimination obligations that complaint monitoring enforces. FFIEC risk factors U9 (consumer complaints alleging discrimination in loan processing or approval/denial), P5 (consumer complaints alleging discrimination in residential loan pricing), S7 (consumer complaints alleging discrimination in residential loan pricing or product placement), and M7 (consumer complaints alleging discrimination in advertising or marketing loans) all ask whether management monitors discrimination complaints. FFIEC Compliance Management Analysis Checklist Appendix §A.1a (management monitors consumer complaints alleging discrimination) and §B (corrective measures, including offering credit if improperly denied, compensating for damages, and correcting institutional policies) require documented complaint intake, analysis, and response processes. NCUA [12 CFR § 701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31) and CFPB supervisory authority over federal credit unions provide the self-referral framework.

**SYSTEM BEHAVIOR:** This control operates six sub-elements:

**1. Intake and logging.** Complaints are captured from all channels — member-direct, CFPB portal, NCUA, state regulators, third-party partners, and internal staff referrals — in the centralized complaint log within one business day of receipt. Each complaint record must include: date received (`complaint.channel`), channel, member/applicant identifier (`complaint.member_id`), product type (`complaint.category`), complaint description (`complaint.narrative`), and receiving staff member. The complaint log is write-restricted to Compliance and designated intake staff.

**2. Prohibited-basis triage.** Every complaint is screened within three business days for potential fair-lending relevance. A prohibited-basis flag is assigned covering ECOA/Reg B protected classes (race, color, religion, national origin, sex, marital status, age, familial status, disability, income from public assistance, exercise of CCPA rights) and FHA protected classes where real-estate credit is involved. Complaints flagged as potentially fair-lending related are escalated immediately to Compliance (`complaint.regulator.received` or `escalation.created`).

**3. Compliance review and escalation.** Compliance completes an initial fair-lending assessment of each escalated complaint within ten business days. If the complaint alleges or suggests disparate treatment, discriminatory pricing, inquiry-stage discouragement, redlining, or steering, it is logged in the Fair-Lending Issue Register (`fair_lending.record_appended`) and assigned a severity rating (Low / Medium / High / Potential Pattern). High-severity or pattern-potential complaints are escalated to the CCO within two business days of classification and reported to the Board at the next quarterly cycle.

**4. Pattern analysis.** Compliance reviews the complaint log quarterly, segmented by prohibited basis, product type, loan officer, branch, and third-party partner, to identify emerging patterns. Any cluster of three or more complaints of the same type within a 12-month rolling window triggers a root-cause investigation and CAP within 30 days of identification (`analytics.cap.opened`). The quarterly Monitoring & Reviews report (FL-10) includes a complaint pattern summary.

**5. Remediation tracking.** When a confirmed violation or pattern of violations is identified, Compliance documents and tracks: (a) re-underwriting or reconsideration of affected applications; (b) credit offers or fee refunds where the member suffered quantifiable harm; (c) corrective action for the responsible staff member, loan officer, or third party; and (d) process or system changes to prevent recurrence. Remediation status is tracked to closure in the Fair-Lending Issue Register, with target timelines set at intake and monitored by Compliance monthly.

**6. Regulator self-referral.** If Compliance determines that a pattern of violations may constitute a systemic or willful violation of ECOA, FHA, or related statutes, the CCO must assess self-referral obligations to the NCUA (and, where applicable, the CFPB or DOJ) in consultation with Legal. The self-referral assessment must be documented and retained regardless of outcome.

**Reporting artifacts:** (a) Monthly complaint log summary to Compliance management; (b) fair-lending complaint section in the quarterly Board compliance report; (c) annual fair-lending complaint trend report including year-over-year volume, prohibited-basis distribution, resolution times, remediation outcomes, and any self-referral activity.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Complaint received from any channel (`complaint.received`) | Date received, channel (`complaint.channel`), member/applicant ID (`complaint.member_id`), product type (`complaint.category`), description (`complaint.narrative`), receiving staff | Complaint logged in centralized log (`complaint.logged`); acknowledgment sent (`complaint.acknowledged`) | 1 BD of receipt (enforced by `complaint.ack_due_at`) |
| Complaint logged (`complaint.logged`) | Complaint record, prohibited-basis flag criteria (ECOA/FHA protected classes) | Prohibited-basis triage completed; flag assigned; if flagged, escalated to Compliance (`escalation.created`) | 3 BD of logging (enforced by `complaint.initial_response_due_at` as internal triage SLA) |
| Complaint escalated to Compliance | Complaint record, prohibited-basis flag, escalation details (`escalation.severity`) | Initial fair-lending assessment completed; severity rating assigned (Low/Medium/High/Pattern); if High or Pattern, CCO notified (`escalation.created`) | Assessment: 10 BD; CCO escalation if High/Pattern: 2 BD of classification |
| High or Pattern complaint classified | Severity rating, complaint details, Fair-Lending Issue Register entry (`fair_lending.finding_id`) | Fair-Lending Issue Register entry created (`fair_lending.record_appended`); CCO escalation logged; Board notification queued for next quarterly cycle | 2 BD of classification |
| Quarterly complaint pattern review | Complaint log segmented by prohibited basis, product, LO, branch, third party; 12-month rolling window | Pattern analysis completed; if 3+ same-type complaints in 12 months: CAP opened (`analytics.cap.opened`); complaint pattern summary included in FL-10 quarterly report | Within 30 days of quarter close |
| Pattern of violations confirmed — CAP triggered (`analytics.cap.opened`) | Root-cause analysis, affected applications, harm assessment | Remediation plan documented: re-underwriting, credit offers/fee refunds, staff corrective action, process changes; tracked to closure in Fair-Lending Issue Register (`fair_lending.remediation.opened`) | CAP initiated within 30 days of identification; tracked monthly to closure (enforced by `fair_lending.remediation_due_at`) |
| Systemic or willful violation pattern identified | Pattern documentation, Legal consultation record | Self-referral assessment documented and retained (`fair_lending.record_appended`); referral made or decision not to refer recorded | Assessment: within 30 days of pattern identification; retained regardless of outcome |
| Month closes | Complaint log for the month | Monthly complaint log summary delivered to Compliance management | By 10th of following month |
| Quarter closes | Complaint data, severity distribution, resolution times, remediation status | Fair-lending complaint section included in quarterly Board compliance report (`compliance.board_report.delivered`) | Within 30 days of quarter close (enforced by `compliance.board_report_due_at`) |
| Year closes | Full-year complaint data, prohibited-basis distribution, resolution times, remediation outcomes, self-referral activity | Annual fair-lending complaint trend report produced and retained | By end of Q1 of following year |

**ALERTS/METRICS:** Alert if any complaint is not logged within 1 BD of receipt (target: zero). Alert if prohibited-basis triage is not completed within 3 BD. Alert if initial Compliance assessment of an escalated complaint exceeds 10 BD. Alert if CCO escalation of a High/Pattern complaint exceeds 2 BD. Track open remediation items in the Fair-Lending Issue Register monthly; alert if any item is overdue against its target timeline. Monitor rolling 12-month complaint clusters by type; automated alert when a cluster of 3+ same-type complaints is detected.

---

## Governance & Sign-Off {#governance}

**Policy Owner:** Patrick Wilson, Chief Compliance Officer

**Required Participants:** Lending Operations, Analytics, Third-Party Risk Management, Legal, HR, Marketing

**Review Cadence:** Annual (next review: 2026-07-01); interim review triggered by material regulatory change, new product launch, or examination finding.

**Board Reporting:** At least quarterly; fair-lending complaint section, disparity analytics summary, exception data, corrective action status, and training completion rates included in each report.

**Cross-References:**
- Lending Policy (underwriting standards and credit policy)
- Collections Policy (collections operations beyond fair-lending conduct)
- Enterprise Risk Management Policy and Model Risk Management Program (scoring model governance)
- Third-Party Risk Policy (vendor onboarding and oversight mechanics)
- Privacy Policy (privacy notices and data handling)
- Record Retention Policy (general retention schedules outside fair-lending records)

**Approvals:**

| Approver | Title | Date |
|---|---|---|
| Patrick Wilson | Chief Compliance Officer | [DATE] |
| [Board Chair or Designee] | [Title] | [DATE] |

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The lending-side resources, fields, and events referenced throughout this document (e.g., `loan_application.*`, `applicant.*`, `aan.*`, `valuation.*`, `analytics.*`, `fair_lending.*`, `lo_comp.*`, `hmda.*`, `pricing.*`, `advertising.*`, `ad.*`, `steering_review.*`) are drawn from the registered core-API vocabulary where registered codes exist. Codes that are registered in `core-vocabulary.json` are used verbatim. Codes that appear in the Provisional codes list in DESIGN_NOTES are used with their agreed provisional spelling. Any remaining codes coined in this document follow the Composition grammar (registered object + registered action) and are flagged here collectively: engineering must confirm registration before the next policy review.

- **Disparity thresholds are undefined [THRESHOLD NEEDED].** Compliance has not yet defined the numeric disparity thresholds that trigger a CAP under FL-10. This is flagged as a pre-exam priority. Thresholds must be defined, documented in `compliance.disparity_thresholds`, and approved by the CCO before the next examination cycle. Until defined, Compliance will apply examiner-standard heuristics (e.g., denial-rate ratios, pricing differentials) on a judgment basis and document the rationale.

- **HMDA reporter status.** This policy assumes Pynthia Credit Union meets the HMDA reporting thresholds under Reg C [12 CFR Part 1003](https://www.ecfr.gov/current/title-12/part-1003) and is a covered institution. If Pynthia does not meet the reporting thresholds in a given year, FL-06 GMI collection obligations under Reg B §1002.13 still apply, but LAR submission obligations do not. Compliance must confirm reporter status annually.

- **Small-business phone credit "reasonable time" standard.** Reg B §1002.9(a)(3) does not define "reasonable time" for small-business phone credit. This policy uses 30 days as an internal SLA for Compliance alert purposes. This assumption should be confirmed with Legal and documented in the procedure.

- **Self-test privilege.** FL-12 flags self-test records as privileged under Reg B §1002.15 and FHA 24 CFR 100.142. The policy assumes Pynthia will not voluntarily disclose self-test results to examiners. If Pynthia chooses to disclose, the privilege is waived and the records become available to examiners. Legal must be consulted before any disclosure decision.

- **Shared control SC-02.** The SC-02 block embedded after FL-12 is a shared control whose content is maintained in `shared-controls/record-retention-mechanics.md`. The version embedded here is the authoritative text as of the effective date of this policy. Any update to SC-02 must be propagated to all eight consuming policies simultaneously.

- **Partner risk-tier definitions for third-party MI.** FL-09 references "covered third parties with a fair-lending nexus" but does not define the risk-tier criteria for determining which vendors are covered. Third-Party Risk Management must define and maintain this list in the vendor inventory (`vendor.fl_dd`). Until defined, Compliance will apply the definition to all brokers, correspondents, marketing intermediaries, and appraisers.

- **ADA/accessibility WCAG standard.** FL-07 references WCAG 2.1 AA as the accessibility standard for digital marketing and application flows. This is the current DOJ standard under 28 CFR Part 36 for public accommodations. Engineering must confirm that the application flow and any digital advertising assets are tested against this standard before launch.

- **Redlining methodology procedure document.** FL-10 describes the six-step FFIEC redlining analysis methodology in the policy. A separate procedure document with operational detail (data sources, peer-comparison methodology, census-tract mapping approach) is recommended and should be developed by Analytics and Compliance within 90 days of this policy's effective date.

- **CCO as sole approver.** This policy lists Patrick Wilson, Chief Compliance Officer, as both owner and sole approver. For governance best practice, a second approver (e.g., Board Chair or Chief Lending Officer) is recommended. This is flagged for the next review cycle.
```
