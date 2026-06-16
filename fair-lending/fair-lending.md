---
title: Fair Lending Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Fair Lending, ECOA, FHA, HMDA, Redlining, ADA]
---

## General Policy Statement

Pynthia Credit Union extends credit to all creditworthy applicants without discrimination on any prohibited basis and prohibits disparate treatment, unjustified disparate impact, and redlining across the full credit lifecycle — inquiries, application, evaluation, pricing, appraisal, action-taken notices, monitoring-data collection, advertising, servicing, collections, and record retention — and across all third parties acting for the Credit Union, for whose conduct ECOA liability flows to the Credit Union. Controls combine system enforcement with documented human review and Board oversight; governance is centralized with the Chief Compliance Officer with quarterly Board reporting at minimum. This policy excludes general credit policy, collections operations beyond fair-lending conduct, model governance, third-party program mechanics, privacy handling, and non-fair-lending retention schedules, which are governed by their respective policies.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Completed application — approve/counter/deny | Application complete and decisioned (`loan_application.decisioned`) | 30 days | AAN with reasons + ECOA/score block | [FL-05](#fl-05-action-taken-notices) |
| Incomplete application | Incompleteness detected (`loan_application.incomplete_detected`) | 30 days | Incompleteness notice or AAN | [FL-05](#fl-05-action-taken-notices) |
| Existing-account adverse action | Adverse action decided on account (`account.adverse_action_decided`) | 30 days | AAN with reasons | [FL-05](#fl-05-action-taken-notices) |
| Unaccepted counteroffer | Counteroffer expired without acceptance (`loan_application.counteroffer_expired`) | 90 days | Counteroffer AAN | [FL-05](#fl-05-action-taken-notices) |
| Small-business phone credit (≤$1MM revenue) | Oral adverse decision recorded (`loan_application.oral_adverse_decision`) | Reasonable time | Oral notice logged | [FL-05](#fl-05-action-taken-notices) |
| Appraisal/valuation copy | Valuation completed (`valuation.completed`) | Promptly | Free copy + rights disclosure | [FL-04](#fl-04-appraisal-independence-and-rov) |
| Reconsideration of value | ROV requested (`valuation.rov_requested`) | 15 days | ROV decision logged | [FL-04](#fl-04-appraisal-independence-and-rov) |
| Pricing-exception review | Exception period closes (`pricing.exception_period_closed`) | By 10th of month | Monthly exception review | [FL-03](#fl-03-evaluation-and-pricing-rules) |
| HMDA/LAR QC | Quarter close (`analytics.quarter_closed`) | Quarterly | LAR QC results | [FL-06](#fl-06-government-monitoring-gmihmda) |
| Quarterly disparity analytics | Quarter close (`analytics.quarter_closed`) | 30 days after close | Disparity report | [FL-10](#fl-10-monitoring-and-reviews) |
| Annual redlining review | Year start (`analytics.quarter_closed`) | By Q1 | Redlining review | [FL-10](#fl-10-monitoring-and-reviews) |
| Third-party MI pack | Month close (`vendor.mi_period_closed`) | 5th business day | Fair-Lending MI pack | [FL-09](#fl-09-third-party-fair-lending-oversight) |
| Complaint logging | Complaint received (`complaint.received`) | 1 business day | Centralized complaint log entry | [FL-13](#fl-13-complaint-monitoring) |
| Complaint prohibited-basis triage | Complaint logged (`complaint.logged`) | 3 business days | Prohibited-basis flag | [FL-13](#fl-13-complaint-monitoring) |
| Compliance initial assessment | Complaint escalated (`finding.escalated`) | 10 business days | Issue Register entry | [FL-13](#fl-13-complaint-monitoring) |
| CCO escalation (High/Pattern) | Severity classified (`incident.severity_assigned`) | 2 business days | CCO + Board referral | [FL-13](#fl-13-complaint-monitoring) |
| Complaint-pattern CAP | Pattern identified (`analytics.threshold_breached`) | 30 days | CAP | [FL-13](#fl-13-complaint-monitoring) |
| Role-based onboarding training | Hire into covered role (`employee.hired`) | 30 days of role start | Onboarding completion | [FL-11](#fl-11-training) |
| Annual training | Annual cycle opens (`training.annual_cycle_opened`) | By Dec 31 | Annual completion ≥98% | [FL-11](#fl-11-training) |

## FL-01 — Prohibition, Protected Bases & Inquiry-Stage Discouragement  {#fl-01-prohibition-protected-bases-and-inquiry-stage-discouragement}

**WHY (Reg cite):** ECOA/Reg B bars discrimination on a prohibited basis in any aspect of a credit transaction and prohibits discouraging applicants on a prohibited basis ([§1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4)); FHA bars discrimination in residential real-estate-related transactions ([42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605)); NCUA nondiscrimination rules apply ([12 CFR 701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31)). This control addresses FFIEC overt-discrimination risk factors O4–O5 and Checklist §A.1c (no discouragement of inquiries on a prohibited basis).

**SYSTEM BEHAVIOR:** The system blocks use of protected traits and Compliance-approved proxy variables (e.g., ZIP/neighborhood, property age/location) at every credit-decision stage and screens inquiry-stage interactions for prohibited-basis discouragement — oral statements, delays, differential referrals, or selective product/requirement disclosure. Staff and applicants may report suspected discouragement through a logged escalation path that routes to Compliance for assessment. The protected-trait list and proxy guardrails are write-restricted to Compliance, which reviews them annually with quarterly Board reporting; the guardrail attribute set is also write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Compliance updates the protected-trait/proxy guardrail set (`compliance.guarded_attributes_updated`) | Guardrail definition, approver identity (`compliance.change_rationale`, `compliance.officer_vacancy`) | Published guardrail set (`compliance.guardrails_published`) | — |
| Suspected inquiry-stage discouragement reported (`fair_lending.discouragement_reported`) | Reporter identity, facts, severity (`escalation.reporter_id`, `escalation.facts`, `escalation.severity`) | Escalation routed to Compliance (`escalation.routed`) | Internal: ack 1 BD (enforced by `escalation.ack_timer`) |
| Fair-lending assessment completed (`fair_lending.assessment_completed`) | Assessment dataset, findings (`fair_lending.dataset_version`, `fair_lending.finding_id`) | Assessment record + remediation if needed (`fair_lending.remediation_opened`) | Annual cycle (enforced by `fair_lending.assessment_due`) |

**ALERTS/METRICS:** Target zero unresolved discouragement reports aging past the acknowledgement SLA; alert on any decision referencing a non-approved proxy variable; track guardrail-set version currency against the annual review deadline.

## FL-02 — Permissible Inquiries  {#fl-02-permissible-inquiries}

**WHY (Reg cite):** Reg B limits inquiries about spouse, marital status, sex, childbearing, and similar attributes and requires neutral application handling ([§1002.5](https://www.ecfr.gov/current/title-12/part-1002#p-1002.5)); permissible-evaluation rules apply ([§1002.6](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6)). Addresses FFIEC overt factor O2 (inquiries contrary to Reg B) and Checklist §A.1b.

**SYSTEM BEHAVIOR:** Application forms suppress impermissible fields and present required disclosures (e.g., optional title, alimony/child-support reliance) before any sensitive field is collected; marital-status options are constrained to married/unmarried/separated and only surfaced for joint or secured credit or community-property states. The rendered-form ruleset is write-restricted to Compliance. Target is 100% of applications presenting the proper disclosure set before collection.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Application form rendered to applicant (`application.form_rendered`) | Channel, product type (`application.channel`, `loan_application.product_type`) | Form rendered with permitted fields only (`application.form_rendered`) | — |
| Required disclosures presented before sensitive collection (`application.disclosures_presented`) | Applicant context, disclosure template (`loan_application.gmi`, `disclosure.template_id`) | Disclosure presentation logged (`application.disclosures_presented`) | — |

**ALERTS/METRICS:** Target 100% of submitted applications with disclosure-presentation logged prior to sensitive-field capture; alert on any rendered form exposing an impermissible field.

## FL-03 — Evaluation & Pricing Rules  {#fl-03-evaluation-and-pricing-rules}

**WHY (Reg cite):** Reg B requires demonstrably and statistically sound or documented judgmental evaluation, equal treatment of public-assistance income, and no negative factor for elderly applicants ([§1002.6](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6)); Reg Z governs higher-priced-loan and pricing standards ([§1026.24](https://www.ecfr.gov/current/title-12/part-1026#p-1026.24)). Addresses FFIEC pricing factors P1–P5 and Checklist §A.1a (confined pricing ranges, monitored exceptions).

**SYSTEM BEHAVIOR:** Evaluation uses a validated scoring model or documented judgmental criteria; the system rejects any negative age factor for elderly applicants and treats public-assistance income equally. Pricing exceptions and overrides must capture a rationale and route to the required approval tier before pricing is locked; finalization is blocked without captured approval. The credit-config and pricing-exception rulesets are write-restricted to Compliance. Compliance reviews all exceptions monthly by the 10th.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Pricing exception or override requested (`pricing.exception_requested`) | Sheet vs. proposed price, rationale, approver (`pricing.sheet_price`, `pricing.proposed_price`, `pricing.exception_rationale`) | Exception decision recorded (`pricing.exception_decided`) | Internal: approval before lock (enforced by `loan_pricing.locked`) |
| Pricing-exception period closes (`pricing.exception_period_closed`) | Exception demographics summary (`pricing.exception_demographics_summary`) | Monthly exception review completed (`pricing.exception_review_completed`) | By 10th of month (enforced by `pricing.exception_review_due_at`) |
| Higher-priced-loan threshold tested (`loan_pricing.hpml_tested`) | APR, APOR values (`loan_pricing.apr`, `rate_sheet.apor_values`) | HPML test result logged (`loan_pricing.hpml_tested`) | — |

**ALERTS/METRICS:** Alert on any finalized loan lacking a captured exception approval; monitor monthly exception-review completion against the 10th-of-month SLA; flag elderly-age or public-assistance scoring rule changes for Compliance review.

## FL-04 — Appraisal Independence & ROV  {#fl-04-appraisal-independence-and-rov}

**WHY (Reg cite):** Reg B requires free copies of appraisals/valuations and a reconsideration pathway, and prohibits reliance on biased valuations ([§1002.14](https://www.ecfr.gov/current/title-12/part-1002#p-1002.14)); FHA and NCUA nondiscrimination rules apply to valuation practices ([42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605); [12 CFR 701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31)). Addresses FFIEC redlining factor R8 (appraisal/valuation practices) and Checklist §A.1c.

**SYSTEM BEHAVIOR:** Valuation staff are organizationally separated from production influence, and a bias-screen ruleset flags valuations for review before reliance. The system delivers a free copy and rights disclosure promptly after each valuation regardless of credit outcome and provides an ROV pathway with outcomes logged and decided within 15 days of request. The bias-screen ruleset is write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Valuation completed (`valuation.completed`) | Bias-screen rules, appraisal document (`valuation.bias_screen_rules`, `appraisal.document`) | Free copy + rights disclosure sent (`valuation.copy_sent`, `valuation.rights_disclosure_sent`) | Promptly (enforced by `appraisal.delivery_due_at`) |
| Reconsideration of value requested (`valuation.rov_requested`) | Request basis, prior value (`appraisal.value`, `valuation.bias_screen_rules`) | ROV decision logged (`valuation.rov_decided`) | 15 days (enforced by `valuation.rov_due_at`) |

**ALERTS/METRICS:** Alert on ROV requests aging beyond 15 days; target zero appraisal copies undelivered past the prompt-delivery SLA; track bias-screen flag rate as a fair-lending signal.

## FL-05 — Action-Taken Notices  {#fl-05-action-taken-notices}

**WHY (Reg cite):** Reg B sets adverse-action notice content and timing — 30 days for completed/incomplete/existing-account actions, 90 days for unaccepted counteroffers, reasonable time for certain business credit — and requires score disclosure when a score is used ([§1002.9](https://www.ecfr.gov/current/title-12/part-1002#p-1002.9)); FCRA §615 governs credit-report-based adverse action ([15 USC §1681m](https://www.law.cornell.edu/uscode/text/15/1681m)). This is a technical Reg B requirement examiners verify directly.

**SYSTEM BEHAVIOR:** On each adverse, counter, or incomplete decision the system generates an AAN with specific reasons, ECOA notice, and a score block where a score was used, and sends it within the matrix deadline; an accepted counteroffer within the counteroffer window requires no separate AAN, and a small-business phone-credit adverse decision is satisfied by a logged oral notice within a reasonable time. AAN templates and reason-code mappings are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Completed application decisioned adversely (`loan_application.decisioned`) | Applicant identity, decision basis, reason codes, score block (`loan_application.applicant`, `loan_application.action_basis`, `decision.score_block`) | AAN with specific reasons + ECOA/score block (`aan.issued`) | 30 days (enforced by `loan_application.aan_due_at`) |
| Incomplete application detected (`loan_application.incomplete_detected`) | Missing-item description, applicant identity (`loan_application.incomplete_aged`, `loan_application.applicant`) | Incompleteness notice or AAN sent (`loan_application.incompleteness_notice_sent`) | 30 days (enforced by `loan_application.aan_due_at`) |
| Existing-account adverse action decided (`account.adverse_action_decided`) | Account action basis (`loan_account.action_basis`) | AAN with reasons (`aan.issued`) | 30 days (enforced by `loan_account.aan_due_at`) |
| Counteroffer expires unaccepted (`loan_application.counteroffer_expired`) | Counteroffer terms/status (`loan_application.counteroffer_terms`, `loan_application.counteroffer_status`) | Counteroffer AAN issued (`aan.issued`) | 90 days (enforced by `loan_application.counteroffer_aan_due_at`) |
| Small-business phone adverse decision (`loan_application.oral_adverse_decision`) | Oral statement, applicant identity (`loan_application.oral_statement`, `loan_application.applicant`) | Oral notice logged (`notice.oral_logged`) | Reasonable time |

**ALERTS/METRICS:** Target on-time AAN rate ≥99.5% with zero deadline breaches; aging alert on any pending AAN approaching its due timer; track score-block inclusion rate where a score was used.

## FL-06 — Government Monitoring (GMI/HMDA)  {#fl-06-government-monitoring-gmihmda}

**WHY (Reg cite):** Reg B governs GMI collection for covered dwelling-secured applications ([§1002.13](https://www.ecfr.gov/current/title-12/part-1002#p-1002.13)); Reg C governs the LAR and HMDA submission ([12 CFR §1003.4](https://www.ecfr.gov/current/title-12/part-1003#p-1003.4)). Addresses FFIEC compliance-program factor C2 (monitoring data complete) and underwriting/pricing data integrity (Part III.A).

**SYSTEM BEHAVIOR:** For covered transactions the system requests GMI without requiring it, applies the visual-observation/surname rule where required if the applicant declines, and records each LAR row. The LAR undergoes quarterly QC, and submission follows the Reg C calendar. HMDA reporter status and the LAR ruleset are write-restricted to Compliance. The institution's HMDA-reporter status is treated as covered pending confirmation (see Assumptions & Gaps).

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| HMDA-covered application created (`application.hmda_covered_created`) | GMI responses, applicant context (`applicant.gmi_responses`, `loan_application.geography`) | GMI recorded + LAR row written (`hmda.gmi_recorded`, `hmda.lar_row_recorded`) | — |
| Quarter close for LAR QC (`analytics.quarter_closed`) | Current LAR dataset (`hmda.hmda_lar`) | LAR QC completed (`hmda.lar_qc_completed`) | Quarterly (enforced by `hmda.lar_qc_due_at`) |
| HMDA submission window open (`analytics.quarter_closed`) | Final LAR (`hmda.hmda_lar`) | LAR submitted (`hmda.lar_submitted`) | Reg C calendar (enforced by `hmda.submission_due_at`) |

**ALERTS/METRICS:** Track LAR QC variance rate per quarter; alert on submission timer aging against the Reg C deadline; target zero unrecorded GMI on covered applications.

## FL-07 — Advertising, Fair Housing, ADA & Marketing-Reach Review  {#fl-07-advertising-fair-housing-ada-and-marketing-reach-review}

**WHY (Reg cite):** Reg Z governs trigger-term and APR-prominence advertising disclosures ([§1026.24](https://www.ecfr.gov/current/title-12/part-1026#p-1026.24)); FHA and NCUA require the Equal Housing legend and bar exclusionary marketing ([42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605); [12 CFR 701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31)); ADA requires reasonable accommodation in digital channels ([28 CFR Part 36](https://www.ecfr.gov/current/title-28/part-36)). Addresses FFIEC marketing factors M1–M7 and Checklist §A.1e. Pynthia does not currently anticipate significant consumer advertising; these controls are always-on requirements that scale with advertising activity, not volume-gated obligations.

**SYSTEM BEHAVIOR:** Every ad passes a pre-flight checklist — trigger-term disclosures, APR prominence, Fair Housing legend on real-estate ads, and an exclusionary-geo-targeting screen — and cannot launch without recorded checklist approval. Digital marketing and application flows must make reasonable ADA accommodations, validated as part of pre-flight. Any advertising program is periodically assessed for demographic reach across media selection, geo-targeting, and intermediary relationships to confirm it does not systematically exclude prohibited-basis group members; this reach review runs regardless of advertising volume. The pre-flight ruleset and approver list are write-restricted to Compliance/Marketing governance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Ad submitted for pre-flight (`ad.preflight_submitted`) | Creative, audience definition (`ad.creative`, `ad.audience_definition`) | Pre-flight decision recorded (`ad.preflight_decided`) | Before launch |
| Targeting screen completed (`ad.targeting_screen_completed`) | Audience definition, accessibility check (`ad.audience_definition`, `privacy.ada_validation_id`) | Accessibility + targeting screen logged (`ad.accessibility_check`) | Before launch |
| Ad published (`advertising.published`) | Approval id, asset id, medium (`advertising.approval_id`, `advertising.asset_id`, `advertising.medium`) | Publication logged (`advertising.publication_logged`) | — |
| Marketing-reach review due (`advertising.review_requested`) | Geo/lending dataset, assessment area (`analytics.geo_lending_dataset`, `analytics.assessment_area`) | Reach review completed (`advertising.reach_review_completed`) | Periodic (enforced by `advertising.reach_review_due`) |

**ALERTS/METRICS:** Target 100% of ads with a completed pre-flight checklist before launch; alert on any publication lacking an approval id; track reach-review currency and any flagged systematic exclusion.

## FL-08 — LO Compensation & Anti-Steering  {#fl-08-lo-compensation-and-anti-steering}

**WHY (Reg cite):** Reg Z prohibits loan-originator compensation based on loan terms or proxies and requires presentation of meaningful options ([§1026.36(d) and (e)](https://www.ecfr.gov/current/title-12/part-1026#p-1026.36)). Addresses FFIEC steering factors S1–S7 and Checklist §A.1a (referral standards).

**SYSTEM BEHAVIOR:** Compensation plans are screened so pay cannot be based on loan terms or proxies, and at option selection the system presents meaningful alternatives (lowest rate, lowest fees, lowest total cost), blocking finalization without recorded evidence of presentation. Where fewer than three eligible options exist, a Compliance waiver with documented shortfall reason is required. The product menu and steering-review configuration are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| LO compensation plan submitted (`lo_comp.plan_submitted`) | Basis analysis, plan terms (`lo_comp.basis_analysis`, `lo_comp.plan_terms`) | Plan decision recorded (`lo_comp.plan_decided`) | Before activation |
| Option selection started (`application.option_selection_started`) | Eligible options, applicant context (`prequal.product_mapping`, `loan_application.requested_terms`) | Options presented + logged (`application.options_presented`) | Before finalization |
| Fewer than three eligible options detected (`application.option_shortfall_detected`) | Shortfall reason (`loan_application.option_shortfall_reason`) | Waiver decision recorded (`application.option_waiver_decided`) | Before finalization |

**ALERTS/METRICS:** Alert on any finalization lacking recorded option presentation; track option-shortfall waiver frequency by loan officer and branch; monitor compensation-plan screening exceptions.

## FL-09 — Third-Party Fair-Lending Oversight  {#fl-09-third-party-fair-lending-oversight}

**WHY (Reg cite):** ECOA liability for third-party conduct flows to the creditor; Reg B prohibitions apply to agents ([§1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4)); FHA applies to brokers and agents ([42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605)). Addresses FFIEC factors U8, S5–S6, M3 (broker/intermediary conduct) and Checklist §A.1.

**SYSTEM BEHAVIOR:** Fair-lending due diligence is performed at vendor onboarding, and each partner submits a monthly Fair-Lending MI pack (applications, approvals, pricing, exceptions, complaints) due by the 5th business day; MI breaches trigger escalation and corrective-action plans. Vendor classification and MI thresholds are write-restricted to Compliance and Third-Party Risk Management. Program mechanics beyond fair lending are governed by the Third-Party Risk Policy.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Vendor onboarding fair-lending diligence (`vendor.fl_dd_completed`) | Due-diligence package, fair-lending DD scope (`vendor.due_diligence_artifact_id`, `vendor.bsa_function_scope`) | Fair-lending DD completed (`vendor.fl_dd_completed`) | At onboarding |
| Monthly MI period closes (`vendor.mi_period_closed`) | MI pack, MI trends (`vendor.mi_pack`, `vendor.mi_trends`) | MI reviewed (`vendor.mi_reviewed`) | 5th BD (enforced by `vendor.mi_due_at`) |
| MI breach detected (`vendor.mi_breach_detected`) | Breach detail, impacted scope (`vendor.breach_detail`, `vendor.affected_scope`) | CAP issued (`vendor.cap_issued`) | Internal escalation (enforced by `vendor.incident_triage_due`) |

**ALERTS/METRICS:** Alert on any partner MI pack aging past the 5th-business-day SLA; track open vendor CAPs and disparity trends in MI; target zero onboarded fair-lending vendors without completed DD.

## FL-10 — Monitoring & Reviews (Disparity & Redlining)  {#fl-10-monitoring-and-reviews}

**WHY (Reg cite):** Reg B and FHA prohibit disparate treatment, disparate impact, and redlining, requiring monitoring of underwriting, pricing, and geographic lending ([§1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4); [42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605)); Reg C data supports the analysis ([12 CFR §1003.4](https://www.ecfr.gov/current/title-12/part-1003#p-1003.4)). Addresses FFIEC redlining factors R1–R12, the six-step comparative analysis in Part III.G, and Checklist §B (corrective measures).

**SYSTEM BEHAVIOR:** Compliance runs quarterly disparity analytics across applications, approvals, price, terms, denials, and exceptions within 30 days of quarter close, and an annual redlining review by Q1 with Board reporting and corrective actions. The annual redlining review follows the FFIEC Part III.G six-step comparative framework: (1) identify and delineate minority-character areas within the CRA assessment area and reasonably expected market area; (2) determine whether those areas are excluded, under-served, or less-favorably treated; (3) identify contrasting non-minority areas treated more favorably; (4) identify minority areas just outside the assessment area suggesting avoidance; (5) obtain and evaluate the institution's explanation for any disparity; and (6) obtain corroborating or contradicting evidence — covering census-tract-level lending distribution by minority-concentration quartile and peer comparison data. Disparity deltas beyond Compliance-defined thresholds open a CAP. The disparity-threshold and analytics-method rulesets are write-restricted to Compliance. **[THRESHOLD NEEDED]** — Compliance has not yet finalized the disparity thresholds that trigger a CAP; this is a pre-exam priority flagged in Assumptions & Gaps.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter closes for disparity analytics (`analytics.quarter_closed`) | Lending dataset, cohort threshold (`analytics.lending_dataset`, `analytics.cohort_threshold`) | Disparity report completed (`analytics.disparity_report_completed`) | 30 days after close (enforced by `analytics.disparity_due_at`) |
| Annual redlining review window opens (`analytics.quarter_closed`) | Geo lending dataset, assessment area (`analytics.geo_lending_dataset`, `analytics.assessment_area`) | Redlining review completed (`analytics.redlining_review_completed`) | By Q1 (enforced by `analytics.redlining_due_at`) |
| Disparity threshold breached (`analytics.threshold_breached`) | Breach detail (`analytics.breach_detail`) | CAP opened (`analytics.cap_opened`) | 30 days (enforced by `cap.approval_timer`) |
| Analytics method reviewed (`analytics.method_review_completed`) | Group estimators, method scope (`analytics.group_estimators`, `analytics.source_scope`) | Method review completed (`analytics.method_review_completed`) | Periodic (enforced by `analytics.method_review_due_at`) |

**ALERTS/METRICS:** Alert on quarterly disparity report aging past the 30-day SLA and on annual redlining review slipping past Q1; track CAP cycle time from threshold breach; surface disparity deltas by product, branch, and loan officer for the Board pack.

## FL-11 — Training  {#fl-11-training}

**WHY (Reg cite):** Reg B, FHA, and NCUA require staff competence to avoid prohibited-basis conduct ([§1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4); [42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605); [12 CFR 701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31)). Addresses FFIEC compliance-program factor C7 (training) and Checklist §A.1b.

**SYSTEM BEHAVIOR:** Role-based onboarding training is assigned within 30 days of role start, and annual fair-lending training (including contractors and third parties) is due by December 31; content refreshes on rule or product changes. Completion is tracked to ≥98%. The curriculum and assignment rulesets are write-restricted to Compliance and HR.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Employee hired into covered role (`employee.hired`) | Hire date, role curriculum (`training.hire_date`, `training.role_curriculum`) | Onboarding training assigned (`training.assigned`) | 30 days of role start (enforced by `training.onboarding_due_at`) |
| Annual training cycle opens (`training.annual_cycle_opened`) | Curriculum version, assignee roster (`training.content_version`, `training.role_matrix`) | Annual completion recorded (`training.annual_assigned`) | By Dec 31 (enforced by `training.annual_due_at`) |
| Rule or product change detected (`training.content_trigger_detected`) | Change summary (`training.change_summary`) | Refresh training issued (`training.refresh_issued`) | — |

**ALERTS/METRICS:** Track completion percentage against the ≥98% target; alert on onboarding assignments aging past 30 days and annual completions approaching December 31; flag overdue refresher assignments after a rule/product change.

## FL-12 — Record Retention  {#fl-12-record-retention}

**WHY (Reg cite):** Reg B sets fair-lending retention periods ([§1002.12](https://www.ecfr.gov/current/title-12/part-1002#p-1002.12)); Reg C and LO-comp retain on their calendars ([12 CFR §1003.4](https://www.ecfr.gov/current/title-12/part-1003#p-1003.4); [§1026.36](https://www.ecfr.gov/current/title-12/part-1026#p-1026.36)). Addresses FFIEC compliance-program factor C3 (recordkeeping reliability) and Checklist §A.

**SYSTEM BEHAVIOR:** The system retains records per the fair-lending grid — consumer applications/decisions and existing-account adverse actions 25 months; business credit ≤$1MM 12 months; certain business credit >$1MM 60 days, extended to 12 months if reasons or retention are requested; HMDA/GMI and LO-comp per their calendars; and self-tests 25 months — and extends all retention on a litigation or investigation hold. Retention classes and hold authority are write-restricted to Compliance and Legal. Non-fair-lending retention is governed by the Record Retention Policy.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Fair-lending record created (`record.created`) | Retention class, anchor date (`record.retention_class`, `record.retention_anchor`) | Retention clock set (`record.retention_clock_set`) | — |
| Retention period expires (`record.retention_expired`) | Disposal eligibility, hold status (`record.disposal_eligible`, `record.hold_status`) | Record disposed (`record.disposed`) | Per grid (enforced by `record.retention_expires_at`) |
| Litigation/investigation hold placed (`legal.hold_placed`) | Hold scope, matter id (`legal.hold_scope`, `legal.matter_id`) | Hold applied, clock suspended (`record.hold_applied`) | Immediate |

**ALERTS/METRICS:** Target zero disposals of records under hold; alert on retention timers expiring without a disposition decision; track hold coverage against open legal matters.

## FL-13 — Complaint Monitoring  {#fl-13-complaint-monitoring}

**WHY (Reg cite):** Reg B and FHA require management to monitor discrimination complaints across underwriting, pricing, steering, and marketing ([§1002.4](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4); [42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605)). This control addresses FFIEC risk factors U9 (underwriting complaints), P5 (pricing complaints), S7 (steering/product-placement complaints), and M7 (marketing complaints), and satisfies the FFIEC Compliance Management Analysis Checklist requirements for documented complaint intake, analysis, and response (Appendix §A–B).

**SYSTEM BEHAVIOR:** Pynthia maintains a dedicated fair-lending complaint monitoring program with six elements. **Intake and logging:** complaints from all channels (member-direct, CFPB portal, NCUA, state regulators, third-party partners, internal staff referrals) are captured in a centralized log within one business day of receipt, each record carrying date received, channel, member/applicant identifier, product type, complaint description, and receiving staff member. **Prohibited-basis triage:** every complaint is screened within three business days for fair-lending relevance and assigned a prohibited-basis flag against the ECOA/Reg B protected classes (race, color, religion, national origin, sex, marital status, age, public-assistance income, good-faith CCPA-rights exercise) and FHA classes where real-estate credit is involved; flagged complaints escalate immediately to Compliance. **Compliance review and escalation:** Compliance completes an initial fair-lending assessment of each escalated complaint within ten business days; complaints alleging disparate treatment, discriminatory pricing, inquiry-stage discouragement, redlining, or steering are entered in the Fair-Lending Issue Register with a severity rating (Low/Medium/High/Potential Pattern), and High-severity or pattern-potential complaints escalate to the Chief Compliance Officer within two business days of classification and to the Board at the next quarterly cycle. **Pattern analysis:** Compliance reviews the complaint log quarterly, segmented by prohibited basis, product type, loan officer, branch, and third-party partner; any cluster of three or more same-type complaints within a rolling 12-month window triggers a root-cause investigation and CAP within 30 days of identification, and the quarterly Monitoring & Reviews report (FL-10) includes a complaint-pattern summary. **Remediation tracking:** on a confirmed violation or pattern, Compliance documents and tracks (1) re-underwriting/reconsideration of affected applications, (2) credit offers or fee refunds where quantifiable harm occurred, (3) corrective action for the responsible staff member, loan officer, or third party, and (4) process or system changes to prevent recurrence; remediation status is tracked to closure in the Fair-Lending Issue Register, with target timelines set at intake and monitored monthly. **Regulator self-referral:** where a pattern may constitute a systemic or willful ECOA/FHA violation, the Chief Compliance Officer assesses self-referral to the NCUA (and, where applicable, CFPB or DOJ) in consultation with Legal, and the self-referral assessment is documented and retained regardless of outcome. The program produces a monthly complaint-log summary to Compliance management, a fair-lending complaint section in the quarterly Board compliance report, and an annual trend report covering year-over-year volume, prohibited-basis distribution, resolution times, remediation outcomes, and self-referral activity. The Issue Register, severity rubric, and prohibited-basis ruleset are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Complaint received from any channel (`complaint.received`) | Channel, member/applicant id, product type, description, receiving staff (`complaint.channel`, `complaint.member_id`, `complaint.narrative`, `complaint.category`) | Centralized log entry created (`complaint.logged`) | 1 business day (enforced by `complaint.ack_due_at`) |
| Complaint logged for triage (`complaint.logged`) | Prohibited-basis screen inputs, narrative (`complaint.root_cause_tag`, `complaint.narrative`) | Prohibited-basis flag + Compliance escalation (`complaint.investigation_completed`, `finding.escalated`) | 3 business days (enforced by `complaint.initial_response_due_at`) |
| Complaint escalated to Compliance (`finding.escalated`) | Facts, severity (`escalation.facts`, `escalation.severity`) | Issue Register entry + initial assessment (`finding.opened`) | 10 business days (enforced by `finding.response_due_at`) |
| High/Pattern severity classified (`incident.severity_assigned`) | Severity, impact summary (`incident.severity`, `incident.impact_summary`) | CCO + Board referral recorded (`finding.critical_escalated`) | 2 business days (enforced by `finding.escalation_due_at`) |
| Quarterly complaint-pattern review (`complaint.trend_reported`) | Trend summary segmented by basis/product/LO/branch/partner (`complaint.trend_summary`) | Pattern summary delivered (`complaint.trend_reported`) | Quarterly (enforced by `complaint.trend_review_due`) |
| Complaint pattern identified (≥3/12 mo) (`analytics.threshold_breached`) | Cluster detail (`analytics.breach_detail`) | Root-cause CAP opened (`analytics.cap_opened`) | 30 days (enforced by `cap.approval_timer`) |
| Confirmed violation remediation tracked (`fair_lending.remediation_opened`) | Remediation plan, harm assessment (`fair_lending.finding_id`, `complaint.investigation_notes`) | Remediation tracked to closure (`fair_lending.remediation_closed`) | Target set at intake; monitored monthly (enforced by `fair_lending.remediation_due_at`) |
| Annual complaint trend report (`complaint.trend_reported`) | YoY volume, basis distribution, resolution times, self-referral activity (`complaint.trend_summary`) | Annual trend report issued (`complaint.trend_reported`) | Annual (enforced by `complaint.trend_review_due`) |

**ALERTS/METRICS:** Aging alerts at each SLA — 1 BD logging, 3 BD triage, 10 BD initial assessment, 2 BD CCO escalation, 30-day CAP; target zero High/Pattern complaints unescalated past 2 BD; track complaint clusters approaching the three-in-twelve-months threshold and remediation items open past their target timeline.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for all controls FL-01 through FL-13.
- **Required participants:** Lending Operations, Analytics, Third-Party Risk Management, Legal, HR, and Marketing, as invoked by individual controls.
- **Approval:** Approved by Patrick Wilson, Chief Compliance Officer (see front-matter).
- **Review cadence:** Annual policy review by the Owner; quarterly Board reporting at minimum, including the disparity-analytics summary ([FL-10](#fl-10-monitoring-and-reviews)) and the fair-lending complaint section ([FL-13](#fl-13-complaint-monitoring)).
- **Examiner readiness:** Each control is mapped to the FFIEC Interagency Fair Lending Examination Procedures and Compliance Management Analysis Checklist (Appendix §A–B); the WHY blocks identify the corresponding overt, underwriting, pricing, steering, redlining, and marketing risk factors (O1–O5, U1–U9, P1–P7, S1–S8, R1–R12, M1–M7).
- **Cross-references:** Lending Policy, Collections Policy, Enterprise Risk Management Policy / Model Risk Management Program, Third-Party Risk Policy, Privacy Policy, Record Retention Policy, HMDA Policy.

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** Several lending-side codes referenced in the EVENTS tables (e.g., `fair_lending.discouragement_reported`, `analytics.disparity_report_completed`, `analytics.redlining_review_completed`, `ad.preflight_submitted`, `lo_comp.plan_submitted`, `complaint.trend_summary`, `valuation.bias_screen_rules`) map to the registered or provisional naming scheme in `core-vocabulary.json` but some specific spellings are not yet registered. These collectively use the target naming scheme and will be confirmed by engineering before the next review. Where a provisional spelling exists in DESIGN_NOTES (e.g., `complaint.summary_id`, `complaint.id`), that exact spelling is used.
- **Disparity thresholds undefined.** Compliance has not finalized the disparity deltas that trigger a CAP in [FL-10](#fl-10-monitoring-and-reviews); the policy carries a `[THRESHOLD NEEDED]` placeholder. Defining these thresholds is a pre-examination priority and must be completed before the next fair-lending exam cycle.
- **HMDA reporter status unconfirmed.** [FL-06](#fl-06-government-monitoring-gmihmda) treats Pynthia as a covered HMDA reporter and applies the full LAR/QC/submission cycle; actual reporter status and Reg C applicability must be confirmed by Compliance, which would scope GMI collection and submission obligations.
- **NCUA Part 701.31 applicability.** The policy assumes Pynthia is a federally chartered credit union subject to NCUA nondiscrimination requirements; charter type and the precise scope of Part 701.31 signage/advertising obligations should be confirmed.
- **Partner risk-tier and MI thresholds.** [FL-09](#fl-09-third-party-fair-lending-oversight) assumes Compliance-defined MI breach thresholds and partner risk tiers; these definitions are not yet documented and must be confirmed with Third-Party Risk Management.
- **Small-business "reasonable time" undefined.** The reasonable-time standard for small-business phone-credit oral notices in [FL-05](#fl-05-action-taken-notices) is not quantified; Compliance should set an internal SLA to make the deadline enforceable.
- **Advertising volume context.** [FL-07](#fl-07-advertising-fair-housing-ada-and-marketing-reach-review) documents always-on controls despite Pynthia's limited advertising profile; the periodicity of the marketing-reach review is assumed and should be set by Compliance/Marketing governance.
- **Redlining methodology procedure document.** [FL-10](#fl-10-monitoring-and-reviews) summarizes the FFIEC Part III.G six-step framework inline; if a standalone redlining-methodology procedure document is created, it should be linked from FL-10 and confirmed to cover quartile-based tract analysis and peer comparison.
