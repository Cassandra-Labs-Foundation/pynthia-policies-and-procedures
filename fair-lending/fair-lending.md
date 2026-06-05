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

# Fair Lending Policy

## General Policy Statement

Pynthia Credit Union makes credit available to all creditworthy applicants without discrimination on any prohibited basis — race, color, religion, national origin, sex, marital status, age (where the applicant can contract), receipt of public assistance, good-faith exercise of Consumer Credit Protection Act rights, handicap/disability, or familial status — and prohibits disparate treatment, unjustified disparate impact, and redlining at every stage of the credit lifecycle: marketing, inquiry, application, evaluation, pricing, appraisal, action-taken notices, monitoring-data collection, servicing, collections conduct, and record retention. The policy binds all staff and all third parties acting for the Credit Union (for whose conduct ECOA liability flows to the Credit Union), combines system enforcement with documented human review and Board oversight, and is owned by the Chief Compliance Officer with at-least-quarterly Board reporting. Underwriting standards, collections operations, scoring-model governance, third-party program mechanics, privacy, and general retention schedules are governed by their own policies (Lending, Collections, Enterprise Risk Management / Model Risk Management, Third-Party Risk, Privacy, Record Retention).

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Completed consumer application — approve, counter, or deny | Application complete (`loan_application.completed`) | 30 days | Notice of action taken; AAN with specific reasons + ECOA notice + score block if a score was used | [FL-05](#fl-05-action-taken-notices) |
| Incomplete application — adverse action or notice of incompleteness | Application aged incomplete (`loan_application.incomplete_detected`) | 30 days | AAN, or notice of incompleteness naming missing items and a response window | [FL-05](#fl-05-action-taken-notices) |
| Adverse action on an existing account | Adverse change decided (`account.adverse_action_decided`) | 30 days | AAN with specific reasons + ECOA notice | [FL-05](#fl-05-action-taken-notices) |
| Counteroffer not expressly accepted or used | Counteroffer issued (`application.counteroffer_issued`) | 90 days | AAN (or combined counteroffer/AAN sent within the original 30 days) | [FL-05](#fl-05-action-taken-notices) |
| Small-business credit ≤ $1MM revenue, decision by phone | Adverse decision communicated orally (`loan_application.oral_adverse_decision`) | Reasonable time | Oral or written statement of action taken and right to reasons | [FL-05](#fl-05-action-taken-notices) |
| Suspected inquiry-stage discouragement reported | Report received (`fair_lending.discouragement_reported`) | 5 BD to triage (internal) | Triage record; escalation to CCO with disposition | [FL-01](#fl-01-prohibition-and-protected-bases) |
| Reconsideration of value (ROV) request | ROV requested (`valuation.rov_requested`) | 15 days (internal) | ROV review outcome, logged with rationale | [FL-04](#fl-04-appraisal-independence-and-rov) |
| Copy of appraisal / written valuation | Valuation completed (`valuation.completed`) | Promptly upon completion | Free copy of each appraisal and written valuation, regardless of outcome | [FL-04](#fl-04-appraisal-independence-and-rov) |
| Pricing-exception review | Month closes (`pricing.exception_period_closed`) | 10th of following month | Compliance exception-review memo | [FL-03](#fl-03-evaluation-and-pricing-rules) |
| Vendor Fair-Lending MI pack | Month closes (`vendor.mi_period_closed`) | 5th business day | MI pack: applications, approvals, pricing, exceptions, complaints | [FL-09](#fl-09-third-party-fair-lending-oversight) |
| Quarterly disparity analytics | Quarter closes (`analytics.quarter_closed`) | 30 days after quarter close | Disparity analysis: applications / approvals / price / terms / denials / exceptions | [FL-10](#fl-10-monitoring-and-reviews) |
| Quarterly LAR QC | Quarter closes (`hmda.lar_qc_due`) | Quarter close + QC window | LAR accuracy QC report | [FL-06](#fl-06-government-monitoring-gmi-and-hmda) |
| Annual HMDA LAR submission | Reg C calendar (`hmda.submission_window_open`) | March 1 (Reg C calendar) | Submitted LAR | [FL-06](#fl-06-government-monitoring-gmi-and-hmda) |
| Annual redlining review | Year closes (`analytics.redlining_review_due`) | End of Q1 | Redlining review per the FFIEC Part III.G methodology, with Board report | [FL-10](#fl-10-monitoring-and-reviews) |
| Annual marketing demographic-reach assessment | Annual cycle opens (`advertising.reach_review_due`) | Annually, with Q1 redlining review | Reach assessment: media selection, geo-targeting, intermediary relationships | [FL-07](#fl-07-advertising-fair-housing-and-accessibility) |
| Role-based onboarding training | Role start (`training.role_assigned`) | 30 days of role start | Completion record | [FL-11](#fl-11-training) |
| Annual fair-lending training | Annual cycle opens (`training.annual_cycle_opened`) | December 31 | Completion record (staff, contractors, third parties) | [FL-11](#fl-11-training) |
| Record retention — consumer applications/decisions, existing-account adverse actions, self-tests | Action-taken notice sent (`notice.sent`) | 25 months | Application, evaluation materials, notice copy, reasons | [FL-12](#fl-12-record-retention) |
| Record retention — business credit ≤ $1MM | Action-taken notice sent (`notice.sent`) | 12 months | Same record set | [FL-12](#fl-12-record-retention) |
| Record retention — certain business credit > $1MM | Action-taken notice sent (`notice.sent`) | 60 days (12 months on request) | Same record set; extended if reasons or retention requested | [FL-12](#fl-12-record-retention) |
| Complaint logged in centralized log | Complaint received, any channel (`complaint.received`) | 1 business day | Complaint record: date, channel, member/applicant ID, product, description, receiving staff | [FL-13](#fl-13-fair-lending-complaint-monitoring) |
| Prohibited-basis triage of every complaint | Complaint logged (`complaint.logged`) | 3 business days | Prohibited-basis flag; immediate escalation to Compliance if flagged | [FL-13](#fl-13-fair-lending-complaint-monitoring) |
| Compliance initial fair-lending assessment | Flagged complaint escalated (`escalation.created`) | 10 business days | Assessment; Fair-Lending Issue Register entry with severity rating | [FL-13](#fl-13-fair-lending-complaint-monitoring) |
| CCO escalation of High / Potential-Pattern complaint | Severity classified High or Potential Pattern (`fair_lending.assessment_completed`) | 2 business days of classification | CCO escalation record; Board reporting at next quarterly cycle | [FL-13](#fl-13-fair-lending-complaint-monitoring) |
| Pattern-triggered root-cause investigation and CAP | Cluster of ≥ 3 same-type complaints in rolling 12 months (`complaint.trend_reported`) | 30 days of identification | Root-cause investigation; CAP with owner and due date | [FL-13](#fl-13-fair-lending-complaint-monitoring) |

## FL-01 — Prohibition and Protected Bases

**WHY (Reg cite):** ECOA/Reg B [§1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4) prohibits discrimination — and §1002.4(b) prohibits discouraging applicants or prospective applicants — on a prohibited basis as defined in [§1002.2](https://www.ecfr.gov/current/title-12/part-1002#p-1002.2); the Fair Housing Act [42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605) and NCUA [§701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31) extend the prohibition to real-estate-related transactions, including factors that act as proxies (dwelling age/location, neighborhood income, ZIP code). The FFIEC Interagency Fair Lending Examination Procedures treat pre-application discouragement as overt-discrimination risk factors O4–O5 and test for it under Compliance Management Analysis Checklist §A.1c.

**SYSTEM BEHAVIOR:** Decisioning, pricing, marketing-segmentation, and servicing systems exclude protected traits and Compliance-designated proxy fields (ZIP/neighborhood identifiers, property age/location, neighborhood income) from all rule sets, models, and audience filters; attempts to reference a blocked field are rejected at configuration time, and a documented business-necessity exception with a less-discriminatory-alternative analysis, approved by Compliance, is required before any guarded attribute may be used for a real-estate-related transaction. Staff may not, on a prohibited basis, discourage inquiries or applications by any means — oral statements, delays, differential referrals, selective disclosure of products or requirements, or otherwise — and front-line workflows surface the prohibited-basis list and a standard product-disclosure script at every inquiry touchpoint. Any employee, member, or third party may report suspected inquiry-stage discouragement through the complaint channel ([FL-13](#fl-13-fair-lending-complaint-monitoring)) or directly to Compliance; reports are triaged within 5 business days, escalated to the Chief Compliance Officer, and tracked to disposition with remediation where substantiated. The protected-trait list and proxy guardrails are write-restricted to Compliance; the policy is reviewed annually and reported to the Board quarterly under [FL-10](#fl-10-monitoring-and-reviews).

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New or changed decision/pricing/marketing rule submitted (`rule.change_submitted`) | Rule definition and referenced fields (`rule.fields_referenced[]`), guarded-attribute list (`compliance.guarded_attributes[]`) | Guardrail scan result; block on match (`rule.guardrail_check_completed`) | Before rule activation (—) |
| Business-necessity exception requested (`rule.exception_requested`) | Justification and less-discriminatory-alternative analysis (`rule.exception_justification`), requesting owner (`rule.exception_owner`) | Compliance approval or denial, recorded with rationale (`rule.exception_decided`) | Before use (internal: 10 BD) |
| Guarded-attribute list updated by Compliance (`compliance.guarded_attributes_updated`) | New list version (`compliance.guarded_attributes[]`), change rationale (`compliance.change_rationale`) | Versioned list republished to all decisioning systems (`compliance.guardrails_published`) | Same business day (—) |
| Suspected inquiry-stage discouragement reported (`fair_lending.discouragement_reported`) | Report detail and channel (`escalation.description`), staff/branch involved (`escalation.facts`) | Triage record; escalation to CCO with disposition and remediation (`fair_lending.remediation_opened`) | Triage within 5 BD; disposition within 30 days (internal) |

**ALERTS/METRICS:** Count of guardrail-scan blocks per quarter (each reviewed by Compliance); zero production rules referencing guarded attributes without an approved exception; exception inventory aging (none older than 12 months without re-approval); discouragement-report count, triage latency, and substantiation rate reported to the Board quarterly.

## FL-02 — Permissible Inquiries

**WHY (Reg cite):** Reg B [§1002.5](https://www.ecfr.gov/current/title-12/part-1002#p-1002.5) limits requests for information about spouses, marital status, sex, childbearing intentions, and other sensitive topics, and requires that monitoring-related and alimony/child-support disclosures be presented before such information is collected.

**SYSTEM BEHAVIOR:** Application forms and digital flows expose spouse, marital-status, sex, childbearing, and immigration questions only in the configurations Reg B permits (e.g., marital status only for joint/secured credit or community-property reliance, using only married/unmarried/separated; title designation only if disclosed as optional; permanent-residence and immigration status permitted; race/religion/national origin never). Required disclosures — including that alimony, child support, or separate maintenance income need not be revealed unless relied upon — render before any sensitive field is collected, and the form engine blocks submission paths that would collect an impermissible field. Form-template changes are write-restricted to Compliance-approved releases. Target: 100% of applications collected with proper disclosures.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Application form rendered to an applicant (`application.form_rendered`) | Product type (`loan_application.product_type`), credit structure joint/individual/secured (`loan_application.credit_structure`), applicant state (`applicant.state`) | Permitted-question set + pre-collection disclosures rendered (`application.disclosures_presented`) | Before sensitive fields collected (—) |
| Form template change proposed (`form.template_change_submitted`) | Template diff (`form.template_diff`), question inventory (`form.question_inventory[]`) | Compliance approval and versioned release (`form.template_approved`) | Before release (internal: 5 BD) |
| Application submitted (`application.submitted`) | Captured field set (`loan_application.data`), disclosure timestamps (`application.disclosure_timestamps[]`) | Inquiry-compliance check pass/fail record (`application.inquiry_check_completed`) | At submission (—) |

**ALERTS/METRICS:** Disclosure-before-collection rate (target 100%); count of blocked impermissible-field collection attempts; zero released form templates without Compliance approval.

## FL-03 — Evaluation and Pricing Rules

**WHY (Reg cite):** Reg B [§1002.6](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6) requires that credit be evaluated under a demonstrably and statistically sound, empirically derived system or documented judgmental criteria, bars assigning a negative factor or value to the age of an elderly applicant, and requires public-assistance income to be considered on equal terms. The FFIEC underwriting and pricing risk factors U1–U9 and P1–P7 frame the discretion and exception monitoring this control enforces.

**SYSTEM BEHAVIOR:** Decisioning runs only on Compliance-registered scoring models (validated as demonstrably and statistically sound under the Model Risk Management Program) or on documented judgmental criteria; age may be used only as permitted (e.g., capacity to contract; elderly age never as a negative factor — the system rejects scorecards that assign negative weight to age ≥ 62), and public-assistance income is mapped to the same income classes as other income. Any deviation from rate sheet or decision matrix requires a pricing-exception record with approver identity and rationale before the loan can proceed; undocumented exceptions block funding. Compliance reviews the full exception log monthly by the 10th. Exception-approval authority and the registered-model list are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Application decisioned (`loan_application.decisioned`) | Registered model or judgmental criteria ID (`decision.model_id`), application data evaluated (`loan_application.data`), income classifications (`loan_application.income_assets`) | Decision record with basis and factor weights (`decision.recorded`) | At decision (—) |
| Pricing deviates from rate sheet (`loan_pricing.exception_requested`) | Standard price (`pricing.sheet_price`), proposed price (`pricing.proposed_price`), rationale (`pricing.exception_rationale`), approver (`pricing.exception_approver`) | Approved/denied exception record; funding blocked until decided (`pricing.exception_decided`) | Before funding (—) |
| Monthly exception period closes (`pricing.exception_period_closed`) | Full exception log for the month (`pricing.exceptions[]`), applicant-distribution summary (`pricing.exception_demographics_summary`) | Compliance exception-review memo with findings (`pricing.exception_review_completed`) | By the 10th of the following month (enforced by `pricing.exception_review_due_at`) |

**ALERTS/METRICS:** Exception rate by product, branch, and originator (outliers flagged); 100% of exceptions with rationale and approver before funding; monthly review on-time rate (target 100%); zero scorecards with negative elderly-age factors in production.

## FL-04 — Appraisal Independence and ROV

**WHY (Reg cite):** Reg B [§1002.14](https://www.ecfr.gov/current/title-12/part-1002#p-1002.14) requires the appraisal-rights disclosure and prompt free copies of appraisals and written valuations on first-lien dwelling applications; NCUA [§701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31) and FHA [42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605) prohibit reliance on valuations that consider prohibited bases, supplemented by the appraisal-independence rules under TILA/Reg Z ([Part 1026](https://www.ecfr.gov/current/title-12/part-1026)).

**SYSTEM BEHAVIOR:** Valuation ordering is routed through a panel-management function organizationally separated from production; production staff cannot select, communicate value targets to, or compensate appraisers, and the assignment queue is write-restricted to the valuation function. Incoming valuations are screened for prohibited-basis references (neighborhood demographic commentary, etc.); flagged valuations are quarantined from decisioning until Compliance disposition, and appraisers found to consider prohibited bases are removed from the panel. Applicants receive the §1002.14 rights disclosure at application and a free copy of every appraisal and written valuation promptly upon completion, regardless of outcome. Any applicant may request a reconsideration of value; ROV reviews complete within 15 days of request with the outcome and rationale logged.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| First-lien dwelling application taken (`application.first_lien_created`) | Applicant contact details (`applicant.contact`), product type (`loan_application.product_type`) | Appraisal-rights disclosure delivered (`valuation.rights_disclosure_sent`) | Within 3 business days of application (—) |
| Valuation order needed (`valuation.order_requested`) | Property details (`property.address`), panel roster (`valuation.panel_roster[]`) | Independent assignment, production-isolated (`valuation.order_assigned`) | At order (—) |
| Valuation received (`valuation.completed`) | Valuation document (`valuation.report`), bias-screen ruleset (`valuation.bias_screen_rules`) | Bias-screen result; free copy sent to applicant (`valuation.copy_sent`) | Promptly upon completion (internal: 3 BD) |
| ROV requested by applicant (`valuation.rov_requested`) | Original valuation (`valuation.report`), applicant-supplied evidence (`valuation.rov_evidence[]`) | ROV outcome with rationale, applicant notified (`valuation.rov_decided`) | 15 days of request (enforced by `valuation.rov_due_at`) |

**ALERTS/METRICS:** ROV aging alert at day 10; valuation-copy delivery latency distribution (target: 100% within internal SLA); count of bias-screen quarantines and panel removals per quarter (each reported to Compliance).

## FL-05 — Action-Taken Notices

**WHY (Reg cite):** Reg B [§1002.9](https://www.ecfr.gov/current/title-12/part-1002#p-1002.9) sets the 30-day / 90-day / reasonable-time notification regime and the specific-reasons requirement; FCRA [§615](https://www.law.cornell.edu/uscode/text/15/1681m) requires consumer-report and credit-score disclosures when adverse action rests on a consumer report or score.

**SYSTEM BEHAVIOR:** The lending platform tracks every application against the deadlines in the [Timing Matrix](#timing-matrix) and generates the correct notice — approval, counteroffer, adverse action with specific principal reasons and the ECOA notice, or notice of incompleteness naming the missing items and a response window — from the decision record; a notice cannot be sent without populated reason codes when adverse, and a score block (score, range, key factors, score source and date) is appended automatically whenever a credit score was used. A counteroffer expressly accepted or used by the applicant within 90 days requires no further adverse-action notice; the Credit Union may instead send a combined counteroffer/AAN within the original 30 days. For small-business applicants (≤ $1MM gross revenue) decided by phone, the statement of action taken and right to reasons may be oral, and the system logs the oral-notice record. Notice templates are write-restricted to Compliance. Target: on-time rate ≥ 99.5% with zero deadline breaches.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Completed application decisioned (`loan_application.decisioned`) | Decision basis (`decision.recorded`), reason codes if adverse (`loan_application.action_basis`), score details if used (`decision.score_block`) | Approval / counteroffer / AAN with ECOA notice + score block (`notice.sent`) | 30 days of completed application (internal: 5 BD; enforced by `application.notice_due_at`) |
| Application aged incomplete (`loan_application.incomplete_detected`) | Missing-item list (`application.missing_items[]`), applicant contact (`applicant.contact`) | AAN, or notice of incompleteness with response window (`notice.incompleteness_sent`) | 30 days (enforced by `application.notice_due_at`) |
| Adverse action on existing account decided (`account.adverse_action_decided`) | Account identity (`account.id`), action basis and reason codes (`loan_account.action_basis`) | AAN with specific reasons + ECOA notice (`notice.sent`) | 30 days (enforced by `account.aan_due_at`) |
| Counteroffer not accepted or used (`application.counteroffer_expired`) | Counteroffer terms (`loan_application.counteroffer_terms`), acceptance status (`loan_application.counteroffer_status`) | AAN (`notice.sent`) | 90 days of counteroffer (enforced by `application.counteroffer_due_at`) |
| Oral adverse decision to small-business phone applicant (`loan_application.oral_adverse_decision`) | Revenue tier (`applicant.business_revenue_tier`), statement of action and right to reasons (`loan_application.oral_statement`) | Oral-notice log entry (`notice.oral_logged`) | Reasonable time (internal: 5 BD) |

**ALERTS/METRICS:** Notice-aging alerts at 60% and 90% of each deadline; on-time rate ≥ 99.5%; zero breaches (any breach triggers root-cause review); reason-code completeness 100% on adverse notices.

## FL-06 — Government Monitoring (GMI and HMDA)

**WHY (Reg cite):** Reg B [§1002.13](https://www.ecfr.gov/current/title-12/part-1002#p-1002.13) requires requesting (not requiring) monitoring information on covered dwelling-secured applications, with visual-observation/surname collection when the applicant declines in person; HMDA/Reg C [§1003.4](https://www.ecfr.gov/current/title-12/part-1003#p-1003.4) governs LAR data compilation, accuracy, and submission per the [Part 1003](https://www.ecfr.gov/current/title-12/part-1003) calendar.

**SYSTEM BEHAVIOR:** For covered transactions, the application flow requests GMI with the required federal-monitoring explanation, accepts an applicant's declination, and — for in-person applications where required — prompts the loan officer to record ethnicity, race, and sex by visual observation or surname, logging the collection method. GMI is firewalled from decisioning: underwriting and pricing systems cannot read GMI fields, which are write-once at collection and readable only by Compliance and HMDA reporting roles. LAR records are compiled continuously, pass quarterly QC against source records, and are submitted annually per the Reg C calendar.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Covered application taken (`application.hmda_covered_created`) | Channel in-person/remote (`loan_application.channel`), applicant GMI responses or declination (`applicant.gmi_responses`) | GMI record with collection method, incl. visual/surname where required (`hmda.gmi_recorded`) | At application (—) |
| Covered action finalized (`application.final_action_recorded`) | Final action, dates, loan terms (`hmda.lar_fields[]`) | LAR row appended (`hmda.lar_row_recorded`) | Within calendar quarter of final action (—) |
| Quarter closes (`hmda.lar_qc_due`) | Quarter's LAR rows (`hmda.lar_rows[]`), source records (`hmda.source_records[]`) | QC report with error rate and corrections (`hmda.lar_qc_completed`) | Quarterly (enforced by `hmda.lar_qc_due_at`) |
| Submission window opens (`hmda.submission_window_open`) | Validated annual LAR (`hmda.lar_final`), reporter credentials (`hmda.reporter_id`) | Submitted LAR with confirmation (`hmda.lar_submitted`) | March 1 per Reg C calendar (enforced by `hmda.submission_due_at`) |

**ALERTS/METRICS:** GMI completion/declination rates by channel; LAR QC error rate (target below resubmission thresholds); zero decisioning-system reads of GMI fields; submission filed on time every cycle.

## FL-07 — Advertising, Fair Housing, and Accessibility

**WHY (Reg cite):** TILA/Reg Z [§1026.24](https://www.ecfr.gov/current/title-12/part-1026#p-1026.24) requires trigger-term disclosures and accurate, prominent APR presentation in credit advertising; the FHA ([42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605), [24 CFR Part 100](https://www.ecfr.gov/current/title-24/part-100)) and NCUA [§701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31) require nondiscriminatory advertising, the Equal Housing legend/logotype on real-estate-related ads, and lobby poster display; the ADA ([28 CFR Part 36](https://www.ecfr.gov/current/title-28/part-36)) requires reasonable accommodations in places of public accommodation, including digital channels. The FFIEC Interagency Fair Lending Examination Procedures marketing risk factors M1–M7 frame the demographic-reach assessment.

**SYSTEM BEHAVIOR:** Pynthia anticipates a limited consumer-advertising profile, but every control in this section applies at any volume — low volume narrows the workload, not the requirement; these are always-on controls that scale with advertising activity. No advertisement launches without a completed pre-flight checklist approval covering trigger-term disclosure completeness, APR prominence, the Equal Housing Lender legend on real-estate-related ads, accessibility of the creative, and audience targeting; the marketing platform blocks publication until the checklist record exists. Geo-targeting and audience filters that exclude majority-minority or other protected-correlated geographies are prohibited and screened against the [FL-01](#fl-01-prohibition-and-protected-bases) guarded-attribute list; inclusionary outreach to underserved areas is permitted. Digital marketing and application flows meet accessibility standards and provide reasonable accommodations for applicants with disabilities (alternative formats, accessible forms, accommodation requests honored and logged). Any active advertising program is assessed at least annually for demographic reach — media selection, geo-targeting, and intermediary relationships — to confirm it is not systematically excluding prohibited-basis group members from Pynthia's market. Each branch and real-estate lending office displays the Equal Housing Lender poster, verified annually. Checklist approval authority is write-restricted to Compliance-designated reviewers. Target: 100% of ads with a completed checklist before launch.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Ad creative submitted for launch (`ad.preflight_submitted`) | Creative and copy (`ad.creative`), trigger terms used (`ad.trigger_terms[]`), audience definition (`ad.audience_definition`), accessibility check result (`ad.accessibility_check`) | Pre-flight checklist approval or rejection; launch blocked until approved (`ad.preflight_decided`) | Before launch (internal: 5 BD) |
| Audience/geo-targeting defined or changed (`ad.targeting_changed`) | Geography and audience filters (`ad.audience_definition`), guarded-attribute list (`compliance.guarded_attributes[]`) | Exclusionary-targeting screen result (`ad.targeting_screen_completed`) | Before launch (—) |
| Accessibility accommodation requested in a marketing or application flow (`accessibility.accommodation_requested`) | Request detail and channel (`accessibility.accommodation_detail`), applicant contact (`applicant.contact`) | Accommodation provided and logged (`accessibility.accommodation_provided`) | Promptly (internal: 3 BD) |
| Annual reach-assessment cycle opens (`advertising.reach_review_due`) | Ad inventory and spend by medium (`advertising.media_inventory[]`), geo-targeting history (`ad.audience_definition`), intermediary list (`intermediary.approved_list`), market demographics (`analytics.assessment_area`) | Demographic-reach assessment with findings and any CAP (`advertising.reach_review_completed`) | Annually, aligned with the Q1 redlining review (—) |
| Annual signage verification cycle opens (`facility.signage_review_due`) | Branch/office roster (`facility.locations[]`) | Poster-display verification record per location (`facility.signage_verified`) | Annually (enforced by `facility.signage_review_due_at`) |

**ALERTS/METRICS:** Checklist completion rate 100% before launch (any launch without one is a reportable incident); count of exclusionary-targeting screen blocks; accommodation-request fulfillment latency (target 100% within internal SLA); reach assessment completed every year an advertising program is active; signage verification 100% of locations annually.

## FL-08 — LO Compensation and Anti-Steering

**WHY (Reg cite):** TILA/Reg Z [§1026.36(d)](https://www.ecfr.gov/current/title-12/part-1026#p-1026.36(d)) prohibits loan-originator compensation based on transaction terms or their proxies, and [§1026.36(e)](https://www.ecfr.gov/current/title-12/part-1026#p-1026.36(e)) prohibits steering and provides the safe harbor of presenting loan options including the lowest rate, lowest points/fees, and lowest total cost; FFIEC steering risk factors S1–S8 frame the examiner's review of channel and product placement.

**SYSTEM BEHAVIOR:** LO compensation plans are registered with Compliance and structurally exclude loan terms and proxies for terms; payroll cannot process a plan outside the registry. For covered originations, the platform requires a documented options-presentation record showing the applicant was shown meaningful alternatives — lowest rate, lowest points/fees, lowest total cost — for each loan type of interest, and blocks finalization until the evidence is attached. Where fewer than three eligible options exist for the applicant, finalization requires a documented Compliance waiver. Compensation-plan registry and waiver authority are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Compensation plan proposed or amended (`lo_comp.plan_submitted`) | Plan terms (`lo_comp.plan_terms`), basis-of-pay analysis (`lo_comp.basis_analysis`) | Registered or rejected plan (`lo_comp.plan_decided`) | Before effect (internal: 10 BD) |
| Covered origination reaches selection (`application.option_selection_started`) | Eligible options across creditors of interest (`application.eligible_options[]`), rate/fee/total-cost figures (`application.option_economics[]`) | Options-presentation record; finalization gated (`application.options_presented`) | Before finalization (—) |
| Fewer than three eligible options exist (`application.option_shortfall_detected`) | Eligibility analysis (`application.eligible_options[]`), shortfall rationale (`loan_application.option_shortfall_reason`) | Compliance waiver or denial (`application.option_waiver_decided`) | Before finalization (internal: 3 BD) |

**ALERTS/METRICS:** Zero finalizations without an options-presentation record or waiver; waiver rate by originator and product (outliers flagged); zero payroll runs against unregistered compensation plans.

## FL-09 — Third-Party Fair-Lending Oversight

**WHY (Reg cite):** Reg B [§1002.2(l)](https://www.ecfr.gov/current/title-12/part-1002#p-1002.2(l)) and [§1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4) make creditor obligations attach to those who participate in credit decisions, so ECOA liability flows to the Credit Union for third-party conduct; FHA [42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605) reaches residential real-estate-related conduct by agents.

**SYSTEM BEHAVIOR:** Lending-related vendors (brokers, dealers, fintech partners, marketing platforms, appraisal management companies) undergo fair-lending due diligence at onboarding — contract clauses requiring fair-lending compliance, review of their decisioning and complaint history — before activation; the vendor registry blocks lending referrals from vendors without a completed due-diligence record. Active vendors submit a monthly Fair-Lending MI pack (applications, approvals, pricing, exceptions, complaints) by the 5th business day; missed packs or adverse trends escalate to a corrective action plan (CAP), and uncured CAPs suspend the relationship. Vendor-sourced fair-lending complaints flow into the centralized complaint log under [FL-13](#fl-13-fair-lending-complaint-monitoring). Program mechanics live in the Third-Party Risk Policy; this control governs the fair-lending content. Vendor activation and CAP decisions are write-restricted to Compliance and Third-Party Risk Management.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Lending vendor onboarding initiated (`vendor.onboarding_started`) | Contract fair-lending clauses (`vendor.contract_terms`), decisioning/complaint history (`vendor.dd_package`) | Fair-lending due-diligence record; activation gated (`vendor.fl_dd_completed`) | Before activation (—) |
| Vendor MI period closes (`vendor.mi_period_closed`) | MI pack: applications, approvals, pricing, exceptions, complaints (`vendor.mi_pack`) | Reviewed MI record with trend findings (`vendor.mi_reviewed`) | 5th business day of following month (enforced by `vendor.mi_due_at`) |
| MI missed or adverse trend detected (`vendor.mi_breach_detected`) | Trend analysis (`vendor.mi_trends`), prior CAP history (`vendor.incident_history`) | CAP issued, tracked to cure or suspension (`vendor.cap_issued`) | Within 10 BD of detection (—) |

**ALERTS/METRICS:** MI on-time rate by vendor (alert on first miss); open-CAP count and aging; zero active lending vendors without completed fair-lending due diligence.

## FL-10 — Monitoring and Reviews

**WHY (Reg cite):** ECOA/Reg B [§1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4) and [§1002.6](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6) require nondiscriminatory outcomes that only statistical monitoring can evidence; the FHA ([42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605)) and the redlining theory applied under it (FFIEC redlining risk factors R1–R12 and the Part III.G comparative-analysis framework) require periodic geographic lending analysis; Reg B [§1002.15](https://www.ecfr.gov/current/title-12/part-1002#p-1002.15) privileges self-test results that this control may produce.

**SYSTEM BEHAVIOR:** Analytics runs quarterly disparity analyses across applications, approvals, pricing, terms, denials, and exceptions, by prohibited-basis group where data lawfully exists (GMI for covered loans; estimation methods elsewhere as approved by Compliance) — due within 30 days of quarter close — and incorporates the quarterly complaint-pattern summary produced under [FL-13](#fl-13-fair-lending-complaint-monitoring). Disparity deltas beyond Compliance-set thresholds automatically open a corrective action plan with named owner and due date; the threshold values are **[THRESHOLD NEEDED]** — Compliance has not yet defined the disparity thresholds that trigger a CAP, and setting them is flagged as a pre-exam priority (no analytics cycle may close without either defined thresholds or a documented CCO interim judgment on every delta). The annual redlining review, due by end of Q1, follows a defined methodology: (1) it covers Pynthia's CRA assessment area and, where appropriate, a broader reasonably expected market area; (2) it maps census-tract-level application, origination, denial, and pricing distributions segmented by minority-concentration quartile; (3) it compares Pynthia's distribution against peer-institution lending data for the same geographies; and (4) it applies the six-step comparative analysis framework of FFIEC Part III.G — identify the relevant market area and demographics, assess explicit and implicit geographic exclusions (branch and service distribution, marketing footprint), compare application and origination penetration in majority-minority vs. non-minority tracts, compare denial rates and terms across tract types, evaluate any identified disparities against legitimate nondiscriminatory explanations, and document conclusions with corrective actions. Results, CAPs, and trends are reported to the Board at least quarterly. Threshold definitions and CAP closure are write-restricted to Compliance; self-test materials are segregated to preserve the §1002.15 privilege.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter closes (`analytics.quarter_closed`) | Decision, pricing, exception, denial datasets (`analytics.lending_dataset`), group estimators (`analytics.group_estimators`), complaint-pattern summary (`complaint.trend_summary`) | Quarterly disparity report with deltas vs. thresholds (`analytics.disparity_report_completed`) | 30 days of quarter close (enforced by `analytics.disparity_due_at`) |
| Disparity delta exceeds threshold (`analytics.threshold_breached`) | Breach detail (`analytics.breach_detail`), threshold definition (`compliance.disparity_thresholds`) | CAP opened with owner and due date (`analytics.cap_opened`) | Within 10 BD of report (—) |
| Annual redlining review due (`analytics.redlining_review_due`) | Assessment-area geography (`analytics.assessment_area`), census-tract lending distribution by minority-concentration quartile and peer data (`analytics.geo_lending_dataset`) | Redlining review per the Part III.G methodology, with findings (`analytics.redlining_review_completed`) | End of Q1 (enforced by `analytics.redlining_due_at`) |
| Board reporting cycle opens (`governance.board_cycle_opened`) | Quarterly results, CAP status, trends (`analytics.board_pack_inputs`) | Board fair-lending report (`governance.board_report_delivered`) | Quarterly (—) |

**ALERTS/METRICS:** Quarterly analysis on-time rate 100%; open-CAP aging (none past due date without Compliance extension); count of threshold breaches per quarter with trend direction; redlining review delivered by Q1 every year; threshold-definition status surfaced on every Board report until **[THRESHOLD NEEDED]** is resolved.

## FL-11 — Training

**WHY (Reg cite):** ECOA/Reg B [§1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4) and NCUA [§701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31) impose nondiscrimination duties that staff and agents can meet only if trained; the FFIEC Compliance Management Analysis Checklist treats training as a core element of a fair-lending compliance management system (compliance-program risk factor C7).

**SYSTEM BEHAVIOR:** The learning platform assigns role-based fair-lending training automatically at role start (due within 30 days) and an annual cycle due by December 31, covering employees, contractors, and in-scope third-party personnel; lending-system access for new roles is provisional until onboarding training completes. Content refreshes when rules or products change, with affected populations re-assigned. Completion is tracked to ≥ 98%, with escalation to managers and HR for overdue assignments. Curriculum assignments and completion records are write-restricted to Compliance and HR training administration.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Role assigned or changed (`training.role_assigned`) | Role-to-curriculum map (`training.curriculum_map`), assignee identity (`training.assignee_id`) | Training assignment with due date (`training.assignment_created`) | At role start; completion within 30 days (enforced by `training.onboarding_due_at`) |
| Annual cycle opens (`training.annual_cycle_opened`) | In-scope population incl. contractors and third parties (`training.role_matrix`) | Annual assignments issued (`training.annual_assigned`) | Completion by December 31 (enforced by `training.annual_due_at`) |
| Rule or product change adopted (`training.content_trigger_detected`) | Change description (`training.change_summary`), affected roles (`training.curriculum_map`) | Refreshed content and re-assignments (`training.refresh_issued`) | Within 60 days of change (—) |
| Assignment completed or lapses (`training.assignment_closed`) | Completion status (`training.completion_status`), score where tested (`training.assessment_score`) | Completion record; overdue escalation if lapsed (`training.completion_recorded`) | Per assignment due date (—) |

**ALERTS/METRICS:** Completion rate ≥ 98% per cycle; overdue-assignment aging with manager/HR escalation at +14 days; 100% of role starts assigned within 5 days.

## FL-12 — Record Retention

**WHY (Reg cite):** Reg B [§1002.12](https://www.ecfr.gov/current/title-12/part-1002#p-1002.12) sets the retention grid — 25 months for consumer applications, evaluation materials, notices, and existing-account adverse actions; 12 months for business credit ≤ $1MM; 60 days for certain business credit > $1MM (extended to 12 months on request for reasons or retention); 25 months for self-test records under [§1002.15](https://www.ecfr.gov/current/title-12/part-1002#p-1002.15) — with HMDA records governed by Reg C [Part 1003](https://www.ecfr.gov/current/title-12/part-1003) and LO-compensation records by Reg Z [§1026.25](https://www.ecfr.gov/current/title-12/part-1026#p-1026.25).

**SYSTEM BEHAVIOR:** The records platform classifies each fair-lending record at creation (consumer application/decision, existing-account adverse action, business-credit tier, GMI/HMDA, LO-comp, self-test) and applies the matching retention clock from the notice date or the applicable calendar; deletion is blocked until the clock expires, and a litigation/investigation hold suspends all destruction for affected records until release. A business-credit applicant's timely request for reasons or retention automatically extends the 60-day class to 12 months. Hold placement and release, and retention-class definitions, are write-restricted to Compliance and Legal.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Action-taken notice sent (`notice.sent`) | Record class consumer/business tier (`record.retention_class`), notice date (`notice.sent_at`) | Retention clock set: 25 months / 12 months / 60 days (`record.retention_clock_set`) | At notice (enforced by `record.retention_expires_at`) |
| Business applicant requests reasons or retention (`record.extension_requested`) | Request timestamp (`record.extension_requested_at`), original class (`record.retention_class`) | Clock extended to 12 months (`record.retention_extended`) | At request (—) |
| Litigation/investigation hold placed (`record.hold_placed`) | Hold scope (`record.hold_scope`), authorizing matter (`record.hold_matter_id`) | Destruction suspended for affected records (`record.hold_applied`) | Immediately (—) |
| Retention clock expires with no hold (`record.retention_expired`) | Hold status (`record.hold_status`), disposal method (`record.disposal_method`) | Certified disposal record (`record.disposed`) | Per schedule after expiry (—) |

**ALERTS/METRICS:** Zero premature destructions (destruction attempts before expiry or under hold are blocked and logged); hold-inventory review quarterly; disposal-backlog aging after expiry.

## FL-13 — Fair-Lending Complaint Monitoring

**WHY (Reg cite):** ECOA/Reg B [§1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4) and FHA [42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605) violations frequently surface first as complaints, and the FFIEC Interagency Fair Lending Examination Procedures ask whether management monitors discrimination complaints under underwriting risk factor U9, pricing risk factor P5, steering risk factor S7, and marketing risk factor M7; the FFIEC Compliance Management Analysis Checklist (Appendix §A–B) requires documented complaint intake, analysis, and response processes. This control is Pynthia's examiner-readiness evidence for those items.

**SYSTEM BEHAVIOR:** Pynthia maintains a dedicated fair-lending complaint monitoring program, standalone from (but feeding) [FL-10](#fl-10-monitoring-and-reviews). *Intake and logging:* complaints from all channels — member-direct, CFPB portal, NCUA, state regulators, third-party partners, and internal staff referrals — are captured in a centralized complaint log within one business day of receipt; each record includes date received, channel, member/applicant identifier, product type, complaint description, and the receiving staff member. *Prohibited-basis triage:* every complaint is screened within three business days and assigned a prohibited-basis flag covering the ECOA/Reg B protected classes (race, color, religion, national origin, sex, marital status, age, familial status, disability, income from public assistance, exercise of CCPA rights) and, where real-estate credit is involved, the FHA protected classes; flagged complaints escalate immediately to Compliance. *Compliance review and escalation:* Compliance completes an initial fair-lending assessment of each escalated complaint within ten business days; complaints alleging or suggesting disparate treatment, discriminatory pricing, inquiry-stage discouragement, redlining, or steering are logged in the Fair-Lending Issue Register with a severity rating (Low / Medium / High / Potential Pattern), and High or Potential-Pattern complaints escalate to the Chief Compliance Officer within two business days of classification and are reported to the Board at the next quarterly cycle. *Pattern analysis:* Compliance reviews the complaint log quarterly, segmented by prohibited basis, product type, loan officer, branch, and third-party partner; any cluster of three or more same-type complaints within a rolling 12-month window triggers a root-cause investigation and CAP within 30 days of identification, and the quarterly [FL-10](#fl-10-monitoring-and-reviews) report includes the complaint-pattern summary. *Remediation tracking:* for each confirmed violation or pattern, Compliance documents and tracks to closure in the Fair-Lending Issue Register (1) re-underwriting or reconsideration of the affected application(s), (2) credit offers or fee refunds where the member suffered quantifiable harm, (3) corrective action for the responsible staff member, loan officer, or third party, and (4) process or system changes to prevent recurrence, with target remediation timelines set at intake and monitored by Compliance monthly. *Regulator self-referral:* if a pattern may constitute a systemic or willful violation of ECOA, FHA, or related statutes, the CCO assesses self-referral obligations to the NCUA (and, where applicable, the CFPB or DOJ) in consultation with Legal, and the assessment is documented and retained regardless of outcome. The program produces a monthly complaint-log summary to Compliance management, a fair-lending complaint section in the quarterly Board compliance report, and an annual trend report covering year-over-year volume, prohibited-basis distribution, resolution times, remediation outcomes, and any self-referral activity. The complaint log and the Fair-Lending Issue Register are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Complaint received from any channel (`complaint.received`) | Date received and channel (`complaint.channel`), member/applicant ID (`complaint.member_id`), product type (`loan_application.product_type`), description (`complaint.narrative`), receiving staff (`complaint.received_by`) | Centralized complaint-log entry (`complaint.logged`) | 1 business day (enforced by `complaint.ack_due_at`) |
| Complaint logged, triage opens (`complaint.logged`) | Complaint category (`complaint.category`), protected-class screen criteria (`complaint.prohibited_basis_criteria`) | Prohibited-basis flag set; immediate Compliance escalation if flagged (`escalation.created`) | 3 business days (internal) |
| Flagged complaint escalated to Compliance (`escalation.routed`) | Complaint record and investigation notes (`complaint.investigation_notes`), lending-file context (`fair_lending.dataset_version`) | Initial fair-lending assessment; Issue Register entry with severity Low/Medium/High/Potential Pattern (`fair_lending.assessment_completed`) | 10 business days (enforced by `fair_lending.assessment_due`) |
| Complaint classified High or Potential Pattern (`fair_lending.assessment_completed`) | Severity rating (`escalation_detail.severity`), Issue Register entry (`fair_lending.finding_id`) | CCO escalation record; queued for next quarterly Board report (`board.notification_sent`) | 2 business days of classification (—) |
| Quarterly pattern review opens (`complaint.trend_review_due`) | Complaint log segmented by prohibited basis, product, loan officer, branch, third party (`complaint.trend_summary`) | Pattern summary; root-cause investigation + CAP on any ≥ 3 same-type cluster in rolling 12 months (`complaint.trend_reported`, `cap.item_created`) | Quarterly; CAP within 30 days of pattern identification (—) |
| Confirmed violation or pattern remediated (`fair_lending.remediation_opened`) | Remediation plan: re-underwriting, refunds/credit offers, staff or third-party corrective action, process changes (`risk_breach.remediation_plan`) | Remediation tracked to closure in the Issue Register (`fair_lending.remediation_closed`) | Per intake timeline; monitored monthly (enforced by `fair_lending.remediation_due_at`) |
| Potential systemic or willful violation identified (`fair_lending.systemic_risk_identified`) | Pattern evidence (`fair_lending.finding_id`), Legal consultation record (`legal.consulted`) | Documented self-referral assessment, retained regardless of outcome (`fair_lending.self_referral_recorded`) | Before pattern CAP closes (internal: 30 days) |
| Monthly reporting cycle closes (`mi.consolidation_due`) | Month's complaint-log entries and remediation statuses (`complaint.trend_summary`) | Monthly complaint-log summary to Compliance management; annual trend report each year-end (`complaint.trend_reported`) | Monthly; annual report by January 31 (—) |

**ALERTS/METRICS:** Logging latency (target 100% within 1 BD); triage latency (target 100% within 3 BD); assessment on-time rate (target 100% within 10 BD); open Issue Register items by severity with aging; count of pattern clusters detected and CAPs opened per quarter; remediation items past target timeline (target zero); self-referral assessments documented for 100% of systemic-risk determinations.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for this policy, the guarded-attribute list, disparity thresholds, exception and waiver authority, discouragement-report dispositions, the Fair-Lending Issue Register, self-referral assessments, and CAP closure.
- **Approvers:** Patrick Wilson, Chief Compliance Officer. Board of Directors ratifies the policy and receives fair-lending reporting at least quarterly per [FL-10](#fl-10-monitoring-and-reviews) and [FL-13](#fl-13-fair-lending-complaint-monitoring).
- **Required participants:** Lending Operations, Analytics, Third-Party Risk Management, Legal, HR, and Marketing, each responsible for executing the controls in their domain.
- **Review cadence:** Full policy review at least annually (next review per front-matter) and upon material regulatory or product change; each review confirms the controls against the FFIEC Interagency Fair Lending Examination Procedures risk factors (O, U, P, S, R, M series) and Compliance Management Analysis Checklist (Appendix §A–B).
- **Cross-references:** Lending Policy (underwriting standards and credit policy), Collections Policy (collections operations), Enterprise Risk Management Policy / Model Risk Management Program (scoring-model governance), Third-Party Risk Policy (vendor program mechanics), Privacy Policy (notices and data handling), Record Retention Policy (general schedules).

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional for a defined set of codes.** The parsed `vocabulary.json` (Cassandra Banking Core API v2.2.0) registers most lending-side events, fields, and timers used here. Codes used in this document as the target naming scheme but not yet registered: `accessibility.accommodation_detail`, `ad.trigger_terms[]`, `advertising.media_inventory[]`, `application.disclosure_timestamps[]`, `application.eligible_options[]`, `application.missing_items[]`, `application.option_economics[]`, `complaint.prohibited_basis_criteria`, `complaint.received_by`, `compliance.guarded_attributes[]`, `facility.locations[]`, `fair_lending.self_referral_recorded`, `fair_lending.systemic_risk_identified`, `form.question_inventory[]`, `hmda.lar_fields[]`, `hmda.lar_rows[]`, `hmda.source_records[]`, `pricing.exceptions[]`, `rule.fields_referenced[]`, `valuation.panel_roster[]`, `valuation.rov_evidence[]`; and codes registered only in the migration map (provisional spellings, reused verbatim): `complaint.channel`, `complaint.narrative`, `escalation.description`, `escalation.facts`, `hmda.reporter_id`, `loan_account.action_basis`, `property.address`, `record.hold_scope`, `training.change_summary`, `valuation.report`, `vendor.contract_terms`, `vendor.dd_package`. Engineering will register or remap these before the next review.
- **Disparity thresholds undefined — pre-exam priority.** [FL-10](#fl-10-monitoring-and-reviews) carries a `[THRESHOLD NEEDED]` placeholder: Compliance has not yet defined the disparity deltas that trigger a CAP, nor the non-mortgage demographic-estimation method. Both must be set before the first quarterly analytics run, and the gap is surfaced on every Board report until resolved.
- **HMDA reporter status assumed.** PATRICK_NOTES require LAR maintenance and annual submission; this policy assumes Pynthia Credit Union meets the Reg C institutional and transaction coverage thresholds. If it does not, [FL-06](#fl-06-government-monitoring-gmi-and-hmda) reduces to Reg B §1002.13 monitoring-information collection only.
- **Federal charter assumed.** NCUA Part 701.31 citations assume a federal credit union charter (the reference policy was written for one). A state charter would substitute the parallel state nondiscrimination rule.
- **Internal SLAs are policy choices, not regulatory deadlines.** The 5-BD notice SLA, 15-day ROV window, 10th-of-month exception review, 5th-business-day MI pack, 30-day quarterly-analytics window, Q1 redlining deadline, and the FL-13 deadlines (1 BD logging, 3 BD triage, 10 BD assessment, 2 BD CCO escalation, 30-day pattern CAP) come from PATRICK_NOTES; the smaller parenthetical internal SLAs (e.g., 3-BD valuation-copy delivery, 10-BD CAP issuance, 5-BD discouragement triage with 30-day disposition, 3-BD accommodation fulfillment, 60-day training refresh, January 31 annual complaint trend report, annual reach-assessment timing aligned to Q1) are minimal-viable choices pending Compliance confirmation.
- **Vendor risk-tier definitions deferred.** The monthly MI-pack requirement applies to all active lending vendors; whether lower-risk tiers may report less frequently is a Third-Party Risk Policy decision not made here.
- **Accessibility standard unspecified.** PATRICK_NOTES require ADA reasonable accommodations in digital marketing and application flows but do not name a technical conformance target (e.g., WCAG 2.1 AA); Compliance and IT must set the standard the [FL-07](#fl-07-advertising-fair-housing-and-accessibility) accessibility check enforces.
- **Small-business notice regime predates Section 1071 data collection.** This policy implements the Reg B §1002.9 small-business notice variants from PATRICK_NOTES; Section 1071 small-business data-collection obligations, if and when applicable to Pynthia, will need their own control.
- **Redlining methodology summarized in policy.** No standalone redlining-review procedure document exists yet; the FFIEC Part III.G-based methodology is summarized in [FL-10](#fl-10-monitoring-and-reviews) and will move to a procedure document when Analytics formalizes one.
