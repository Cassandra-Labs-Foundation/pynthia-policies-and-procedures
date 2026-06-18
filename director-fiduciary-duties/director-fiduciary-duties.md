```yaml
---
title: Director Fiduciary Duties Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-07-01
next_review: 2027-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Fiduciary Duties, Conflicts of Interest, Insider Transactions, Affiliate Transactions, Corporate Governance]
---
```

## General Policy Statement

Pynthia Credit Union requires every director, executive officer, principal shareholder, and any employee or contractor with decision-making authority to act at all times in the best interests of the credit union and its membership. Covered persons owe the credit union the duties of loyalty, care, good faith, confidentiality, and continuing disclosure. Conflict-of-interest identification and disclosure is the primary operational mechanism through which the duty of loyalty is enforced. Insider credit and affiliate transactions are subject to regulatory limits that apply regardless of intent. Violations of this policy expose the credit union and the individual to regulatory sanction, civil liability, and reputational harm. The Chief Compliance Officer owns this policy; the Board of Directors, Legal/General Counsel, and the Supervisory Committee are required participants in its governance.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Annual COI questionnaire cycle opens | Calendar year begins (`coi.annual_cycle_opened`) | 30 days from cycle open | Exhibit A questionnaire | [DF-03](#df-03-annual-continuing-disclosure) |
| Ad-hoc conflict arises mid-year | Covered person identifies conflict (`coi.adhoc_disclosure_filed`) | Immediately / before next Board action | Exhibit B ad-hoc form | [DF-03](#df-03-annual-continuing-disclosure) |
| Annual insider/related-interest record review | Calendar year begins | Annually | Insider record (`insider.record_compiled`) | [DF-03](#df-03-annual-continuing-disclosure) |
| Conflict identified at Board meeting | Agenda item flagged (`board.agenda_item_flagged_conflicted`) | Before vote on matter | Recusal notice | [DF-04](#df-04-conflict-management-recusal) |
| Insider credit application received | Application received (`insider.credit_application_received`) | Before commitment | Terms parity check; Board approval if threshold exceeded | [DF-05](#df-05-insider-transactions-reg-o) |
| Board approval required for insider credit | Aggregate credit exceeds threshold | Before credit extended | Board resolution excluding interested director | [DF-05](#df-05-insider-transactions-reg-o) |
| Insider credit reported to Board | Credit extended to insider | Promptly / next Board meeting | Board report | [DF-05](#df-05-insider-transactions-reg-o) |
| Affiliate covered transaction proposed | Transaction proposed (`affiliate.covered_transaction_proposed`) | Before execution | Limit check; collateral; market-terms basis | [DF-06](#df-06-transactions-with-affiliates-reg-w) |
| Affiliate list annual review | Calendar year begins | Annually | Updated affiliate list | [DF-06](#df-06-transactions-with-affiliates-reg-w) |
| Gift/item of value offered or received | Offer or receipt occurs (`gift.record_entry_created`) | Promptly | Exhibit C threshold check; disclosure to CCO | [DF-07](#df-07-bank-bribery-gifts-kickbacks) |
| Gift disclosures reported to Board | Periodic | Periodically | Board report (`gift.board_report_issued`) | [DF-07](#df-07-bank-bribery-gifts-kickbacks) |
| Corporate opportunity identified | Opportunity identified (`corp_opportunity.identified`) | Before personal pursuit | Full Board presentation; rejection documented | [DF-08](#df-08-corporate-opportunity-tie-ins) |
| Public request for insider credit disclosure | Written request received (`insider.public_disclosure_requested`) | Promptly | Disclosure of names/thresholds; retain request 2 years | [DF-09](#df-09-recordkeeping-reporting) |
| Financial literacy deadline | Director elected or appointed | 6 months | Attainment documented; overdue flag | [DF-01](#df-01-fiduciary-duties) |
| Annual policy acknowledgment | Policy distributed | Annually | Signed acknowledgment | [DF-10](#df-10-training-acknowledgment-enforcement) |
| Annual training cycle | Calendar year begins | Annually | Training completion record | [DF-10](#df-10-training-acknowledgment-enforcement) |

---

## DF-01 — Fiduciary Duties {#df-01-fiduciary-duties}

**WHY (Reg cite):** [12 CFR §701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4) imposes on federal credit union directors the duties of care and loyalty (acting in good faith, in the best interests of the membership, with the care an ordinarily prudent person would use), impartiality (fair administration without discrimination in favor of or against any particular member), and financial literacy (working familiarity with basic finance and accounting within 6 months of election or appointment). General fiduciary duties of loyalty, care, good faith, and confidentiality also arise under applicable state law (see Assumptions & Gaps).

**SYSTEM BEHAVIOR:** The system maintains a roster of covered persons (`covered_person`) with their role, effective date, and — for directors — a financial-literacy attainment flag. On election or appointment, a 6-month financial-literacy deadline task is created. The system flags any director whose deadline has passed without attainment and surfaces the flag in the Board compliance dashboard. Confidentiality of non-public credit union information is enforced by role-based access controls: non-public Board materials are read-restricted to directors, executive officers, and Compliance; write access to the covered-person roster is restricted to the Chief Compliance Officer.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Director or officer elected, appointed, or role changed (`employee.role_changed`) | Covered person identity (`covered_person.id`, `covered_person.role`, `covered_person.effective_date`); role type (director vs. officer) | Covered-person roster entry created or updated (`covered_person.roster_updated`); financial-literacy deadline task created for directors (`training.newhire_due_at`) | Roster updated immediately; financial-literacy task due within 6 months of effective date (enforced by `training.newhire_due_at`) |
| Financial-literacy deadline reached without attainment (`training.lapsed`) | Director identity (`covered_person.id`); attainment status (`training.completion_status`) | Overdue flag raised (`training.content_trigger_detected`); escalation to CCO and Board chair (`escalation.created`) | Immediately on deadline breach |
| Director or officer separated (`employee.separated`) | Covered person identity (`covered_person.id`) | Roster entry deactivated (`covered_person.roster_updated`); access deprovisioned (`access.deprovisioned`) | Immediately on separation |

**ALERTS/METRICS:** Alert fires when any director's financial-literacy task reaches `overdue` status (target: zero overdue directors at any time). Dashboard metric: count of directors with attainment confirmed vs. pending, refreshed on each roster change.

---

## DF-02 — Conflict Identification & General Duties {#df-02-conflict-identification-general-duties}

**WHY (Reg cite):** [12 CFR §563.200](https://www.ecfr.gov/current/title-12/part-563/section-563.200) requires that persons owing a fiduciary duty not advance their own interests at the institution's expense, disclose all material information on matters in which they have an interest, and not participate in Board discussion or vote on such matters. [12 CFR §701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4) reinforces the duty of loyalty and care for federal credit union directors.

**SYSTEM BEHAVIOR:** The system monitors Board agenda items for flagged conflicts. When a covered person self-reports a conflict or the system detects a potential conflict (e.g., a vendor or counterparty matching a covered person's related-party record), the agenda item is flagged and the interested party is blocked from participating in discussion or voting on that matter. The duty to avoid even the appearance of a conflict is enforced by requiring disclosure of any relationship that a reasonable person might question, not only relationships that rise to a legal conflict. The CCO is the sole write-authorized role for conflict determinations; Board minutes are write-restricted to the Board Secretary and CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Covered person identifies a potential conflict with a pending Board matter (`coi.adhoc_disclosure_filed`) | Covered person identity (`covered_person.id`); nature and extent of interest (`coi.interest_description`); matter reference (`coi.matter_reference`); related party (`coi.related_party`) | Ad-hoc disclosure record created (`coi.register_entry_created`); Board agenda item flagged (`board.agenda_item_flagged_conflicted`) | Before Board discussion or vote on the matter |
| Board agenda item is flagged as conflicted (`board.agenda_item_flagged_conflicted`) | Interested party identity (`covered_person.id`); agenda item (`board.agenda_id`); disinterested quorum confirmed (`board.disinterested_quorum`) | Recusal notice issued (`coi.recusal_noticed`); recusal logged (`coi.recusal_logged`) | Before vote |
| Conflict determination made by disinterested Board (`coi.determination_logged`) | Conflict description (`coi.interest_description`); determination outcome (`coi.determination_made`); independent review result if applicable (`coi.independent_review`) | Determination logged in COI register (`coi.determination_logged`); Board minutes updated (`board.minutes_recorded`) | At time of determination |

**ALERTS/METRICS:** Alert fires if a Board vote is recorded on a matter where a flagged conflict exists and no recusal record is present (target: zero such votes). Metric: count of open conflict disclosures awaiting determination, reviewed at each Board meeting.

---

## DF-03 — Annual & Continuing Disclosure {#df-03-annual-continuing-disclosure}

**WHY (Reg cite):** [12 CFR §563.200](https://www.ecfr.gov/current/title-12/part-563/section-563.200) and [12 CFR §215.8](https://www.ecfr.gov/current/title-12/part-215/section-215.8) require annual identification of insiders and their related interests, reviewed for completeness. The continuing obligation to disclose arises from the general fiduciary duty of loyalty and is operationalized through the ad-hoc disclosure mechanism.

**SYSTEM BEHAVIOR:** Each calendar year, the system opens an annual COI questionnaire cycle and issues Exhibit A questionnaires to all directors and executive officers. Responses are due within 30 days of cycle open. The system also compiles the annual insider/related-interest record from questionnaire responses and existing records, circulates it to insiders for completeness review, and retains the completed record. Mid-year, any covered person who becomes aware of a new or changed conflict must file Exhibit B immediately; the system accepts ad-hoc filings at any time. The CCO reviews all submissions; the annual insider record is write-restricted to the CCO and Legal.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual cycle opens (calendar year begins) (`coi.annual_cycle_opened`) | Covered-person roster (`covered_person.id[]`); questionnaire version (`coi.questionnaire_version`) | Exhibit A questionnaires issued to all directors and officers (`coi.questionnaire_issued`) | Cycle opens at start of calendar year; responses due within 30 days (enforced by `coi.questionnaire_due_at`) |
| Covered person submits annual questionnaire (`coi.questionnaire_submitted`) | Questionnaire responses (`coi.questionnaire_responses`); attestation signature (`coi.attestation_signature`); attestation date (`coi.attestation_date`) | Submission logged; COI register entry updated (`coi.register_entry_created`) | Within 30 days of cycle open |
| Annual insider/related-interest record compiled (`insider.record_compiled`) | All insider identities and related interests from questionnaire responses and existing records (`insider.record_entry[]`); prior year record (`insider.record_prior`) | Record compiled and circulated to insiders for review (`insider.record_circulated`); insider survey issued (`insider.survey_issued`) | Annually; completion confirmed by `insider_report.due` |
| Insiders review and confirm record completeness | Insider identity (`covered_person.id`); confirmation of completeness | Record confirmed; any corrections applied (`insider.record_updated`) | Annually, within the review window |
| New or changed conflict arises mid-year (`coi.adhoc_disclosure_filed`) | Covered person identity (`covered_person.id`); conflict description (`coi.interest_description`); matter reference (`coi.matter_reference`) | Ad-hoc Exhibit B disclosure filed and logged (`coi.register_entry_created`) | Immediately upon awareness |

**ALERTS/METRICS:** Alert fires when any director or officer has not submitted their annual questionnaire by the 30-day deadline (target: 100% submission rate). Metric: count of outstanding questionnaires, reported to CCO weekly during the cycle window.

---

## DF-04 — Conflict Management & Recusal {#df-04-conflict-management-recusal}

**WHY (Reg cite):** [12 CFR §563.200](https://www.ecfr.gov/current/title-12/part-563/section-563.200) prohibits interested parties from participating in Board discussion or voting on matters in which they have an interest. The Board must make an independent determination on conflicted matters using only disinterested directors.

**SYSTEM BEHAVIOR:** When a conflict is identified on a Board agenda item, the system enforces recusal by blocking the interested party from the relevant Board discussion record and vote. The disinterested Board majority independently reviews the matter, may appoint a disinterested subcommittee or independent reviewer, and records its determination. Interested parties may make a presentation before the discussion begins but must leave before deliberation and vote. The CCO documents the recusal and determination in the COI register. Board minutes for conflicted matters are write-restricted to the Board Secretary and CCO; the interested party has no write access to those minutes.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Conflict flagged on Board agenda item (`board.agenda_item_flagged_conflicted`) | Interested party identity (`covered_person.id`); agenda item (`board.agenda_id`); nature of conflict (`coi.interest_description`) | Recusal executed and logged (`coi.recusal_executed`, `coi.recusal_logged`); interested party blocked from deliberation and vote | Before deliberation begins |
| Disinterested Board conducts independent review (`coi.determination_logged`) | Disinterested quorum confirmed (`board.disinterested_quorum`); independent review result if applicable (`coi.independent_review`); matter details | Determination logged (`coi.determination_logged`); Board resolution recorded (`board.resolution_id`) | At time of Board action |
| Conflicted matter voted on by disinterested Board | Vote outcome; disinterested quorum (`board.disinterested_quorum`) | Board minutes updated (`board.minutes_recorded`); COI register entry finalized (`coi.certified`) | At time of vote |

**ALERTS/METRICS:** Alert fires if a Board resolution references a matter with an open conflict flag and no `coi.recusal_executed` record (target: zero). Metric: count of conflicted matters resolved by disinterested quorum in the current year, reported in the annual compliance report.

---

## DF-05 — Insider Transactions (Reg O / 12 CFR §701.21(d)) {#df-05-insider-transactions-reg-o}

**WHY (Reg cite):** [12 CFR Part 215 (Regulation O)](https://www.ecfr.gov/current/title-12/part-215) requires that extensions of credit to insiders (directors, executive officers, principal shareholders, and their related interests) be made on substantially the same terms and underwriting standards as comparable non-insider transactions and not involve more than normal risk of repayment. Prior approval of a majority of the entire Board (excluding the interested director) is required when aggregate credit to an insider and related interests exceeds the greater of $25,000 or 5% of unimpaired capital and surplus, or $500,000 ([12 CFR §215.4(b)](https://www.ecfr.gov/current/title-12/part-215/section-215.4)). The single-borrower limit is 15% of unimpaired capital and surplus (plus 10% for readily marketable collateral) ([12 CFR §215.4(c)](https://www.ecfr.gov/current/title-12/part-215/section-215.4)). Aggregate insider credit must not exceed unimpaired capital and surplus ([12 CFR §215.4(d)](https://www.ecfr.gov/current/title-12/part-215/section-215.4)). No insider may knowingly receive credit not in compliance with these restrictions ([12 CFR §215.6](https://www.ecfr.gov/current/title-12/part-215/section-215.6)). Note: [12 CFR §701.21(d)](https://www.ecfr.gov/current/title-12/part-701/section-701.21) sets a Board-approval trigger at $20,000 plus pledged shares for federal credit unions; Legal must confirm the operative threshold based on Pynthia's charter type (see Assumptions & Gaps).

**SYSTEM BEHAVIOR:** When a loan application is flagged as involving an insider (`loan_application.insider_flagged`), the system performs a terms-parity check against comparable non-insider transactions and checks aggregate credit outstanding to the insider and all related interests against the Board-approval threshold and the single-borrower limit. If the aggregate threshold is exceeded, the system blocks commitment until a Board approval record (excluding the interested director) is recorded. Board approval of a line of credit is valid for 14 months (`insider.loc_approval_expires_at`). All extensions of credit to executive officers require a current detailed financial statement on file before commitment. All insider credit extensions are reported promptly to the Board. The aggregate insider limit is monitored continuously; if the limit is approached, an alert is raised. Interested directors are write-blocked from the Board approval record for their own credit.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Loan application received from or involving an insider (`insider.credit_application_received`) | Insider identity (`covered_person.id`); proposed terms (`insider.proposed_terms`); aggregate credit outstanding to insider and related interests (`insider.aggregate_credit_amount`); unimpaired capital and surplus (`cu.unimpaired_capital_surplus`) | Insider flag applied (`loan_application.insider_flagged`); terms parity check initiated (`insider.terms_parity_checked`) | Before underwriting decision |
| Terms parity check completed (`insider.terms_parity_checked`) | Comparable non-insider transaction terms (`insider.comparable_terms`); proposed terms (`insider.proposed_terms`); collateral marketability (`insider.collateral_marketability`) | Parity result logged; if non-parity detected, application blocked pending CCO review | Before commitment |
| Aggregate credit threshold exceeded (`insider.credit_threshold_exceeded`) | Aggregate credit amount (`insider.aggregate_credit_amount`); threshold basis (`cu.unimpaired_capital_surplus`); insider identity (`covered_person.id`) | Board approval task created (`insider_loc_approval`); commitment blocked until approval recorded | Before credit extended; Board approval valid 14 months (`insider.loc_approval_expires_at`) |
| Board approves insider credit (excluding interested director) (`insider.board_approval_recorded`) | Disinterested Board majority vote; interested director excluded (`board.disinterested_quorum`); credit terms (`insider.funded_terms`); Board resolution (`board.resolution_id`) | Board approval recorded (`insider.board_approval_recorded`); approval expiry set for lines of credit (`insider.loc_approval_expires_at`) | Before commitment |
| Credit extended to insider (`insider.credit_extended`) | Funded terms (`insider.funded_terms`); executive officer financial statement if applicable (`insider.officer_financial_statement`) | Extension reported to Board promptly (`insider.board_report_issued`); aggregate limits recomputed (`insider.limits_recomputed`) | Promptly; next Board meeting at latest |
| Public written request for insider credit disclosure received (`insider.public_disclosure_requested`) | Written request (`insider.public_request`); correspondent credit data for prior calendar year (`insider.correspondent_credit_data`) | Public disclosure issued if threshold met (`insider.public_disclosure_issued`); request and disposition retained 2 years (`insider.public_request_retention_expires_at`) | Promptly upon receipt; retention for 2 years |

**ALERTS/METRICS:** Alert fires when aggregate insider credit approaches 90% of unimpaired capital and surplus (target: never breach 100%). Alert fires when a Board approval for a line of credit is within 30 days of expiry (`insider.loc_approval_expires_at`). Metric: count of insider credit extensions reported to Board in the current year, reviewed quarterly.

---

## DF-06 — Transactions With Affiliates (Reg W) {#df-06-transactions-with-affiliates-reg-w}

**WHY (Reg cite):** [12 USC §371c (Federal Reserve Act §23A)](https://www.law.cornell.edu/uscode/text/12/371c) and [12 CFR Part 223 (Regulation W)](https://www.ecfr.gov/current/title-12/part-223) limit covered transactions with any single affiliate to 10% of unimpaired capital and surplus and with all affiliates in the aggregate to 20%, require collateral at specified coverage ratios for credit transactions, prohibit purchase of low-quality assets from affiliates, and require that all covered transactions be on market terms ([12 USC §371c-1 (§23B)](https://www.law.cornell.edu/uscode/text/12/371c-1)). The credit union must maintain an affiliate list updated at least annually and records of all affiliate transactions. Note: Reg W applies directly to member banks; applicability to credit unions is by analogy or through NCUA safety-and-soundness authority — Legal must confirm the operative authority for Pynthia's charter type (see Assumptions & Gaps).

**SYSTEM BEHAVIOR:** Before any covered transaction with an affiliate is executed, the system checks the affiliate list, verifies the transaction type, computes the post-transaction aggregate exposure against the 10%/20% limits, confirms collateral coverage ratios for credit transactions, screens for low-quality asset status, and confirms market-terms basis. Transactions that would breach a limit are blocked pending CCO and Board review. The affiliate list is reviewed and updated at least annually. All affiliate transaction records are retained with the required data fields. The CCO is the sole write-authorized role for the affiliate list and transaction records; Legal must approve any exemption request.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Covered transaction with affiliate proposed (`affiliate.covered_transaction_proposed`) | Affiliate identity (`affiliate.list_entry`); transaction type (`affiliate.transaction_type`); transaction amount (`affiliate.transaction_amount`); current aggregate exposure (`affiliate.limit_utilization`); unimpaired capital and surplus (`cu.unimpaired_capital_surplus`) | Limit check performed (`affiliate.limits_checked`); result logged | Before execution |
| Credit transaction with affiliate proposed | Collateral type (`affiliate.collateral_type`); collateral value (`affiliate.collateral_value`); required coverage ratio (`affiliate.required_coverage_ratio`); asset quality classification (`affiliate.asset_quality_classification`) | Collateral and LQA screen logged (`affiliate.lqa_screen_logged`); if collateral deficient or LQA detected, transaction blocked | Before execution |
| Market-terms basis confirmed | Market-terms documentation (`affiliate.market_terms_basis`); independent evaluation if required (`affiliate.independent_evaluation`) | Market-terms basis recorded (`affiliate.transaction_recorded`) | Before execution |
| Covered transaction executed (`affiliate.credit_transaction_funded`) | All required fields confirmed; limits within bounds | Transaction record archived (`affiliate.transaction_file_archived`) | At execution |
| Annual affiliate list review opened (`affiliate.list_review_opened`) | Current affiliate list (`affiliate.list`); any new affiliates or changes | Affiliate list updated (`affiliate.list_updated`) | Annually |

**ALERTS/METRICS:** Alert fires when aggregate affiliate exposure reaches 80% of the 10% single-affiliate limit or 80% of the 20% aggregate limit (target: never breach either limit). Metric: count of affiliate transactions executed in the current year by type, reported to the Board annually.

---

## DF-07 — Bank Bribery, Gifts & Kickbacks {#df-07-bank-bribery-gifts-kickbacks}

**WHY (Reg cite):** [18 USC §215](https://www.law.cornell.edu/uscode/text/18/215) prohibits any officer, director, employee, agent, or attorney of a financial institution from soliciting or receiving anything of value in connection with any transaction or business of the institution, except for bona fide salary, wages, fees, or other compensation paid in the ordinary course of business. Violation is a criminal offense. The Federal Bank Bribery Law Guidelines (52 Fed. Reg. 43941 (1987)) identify permissible exceptions including de minimis gifts, family gifts, and business-occasion meals.

**SYSTEM BEHAVIOR:** All gifts, gratuities, or items of value offered to or received by covered persons in connection with credit union business must be disclosed to the CCO and logged in the gift register. The system compares the estimated value against the de minimis threshold defined in Exhibit C. Items within the threshold and within a permissible category (family/personal relationship gifts, reasonable business-occasion meals, advertising materials, civic awards, etc.) are logged and closed. Items exceeding the threshold or outside permissible categories require CCO disposition and are reported to the Board periodically. Solicitation or receipt of anything of value outside these parameters is prohibited and triggers an escalation. The gift register is write-restricted to the CCO; Board reports are read-accessible to all directors.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Gift, gratuity, or item of value offered or received (`gift.record_entry_created`) | Covered person identity (`covered_person.id`); source party (`gift.source_party`); estimated value (`gift.estimated_value`); description (`gift.disposition`); threshold comparison (`gift.threshold_comparison`) | Gift record entry created (`gift.record_entry_created`); threshold check performed | Promptly upon offer or receipt |
| Gift exceeds authorized threshold or is outside permissible category | Gift record entry (`gift.record_entry_id`); CCO review | CCO disposition recorded (`gift.disposition`); if prohibited, escalation created (`escalation.created`) | Promptly; CCO disposition within 5 business days |
| Periodic Board report on gift disclosures (`gift.board_report_issued`) | All gift disclosures since last report (`gift.record_entry_id[]`); disposition outcomes | Board report issued (`gift.board_report_issued`) | Periodically (at minimum annually; more frequently if volume warrants) |

**ALERTS/METRICS:** Alert fires when any gift disclosure remains without CCO disposition for more than 5 business days (target: zero unresolved disclosures beyond 5 BD). Metric: count of gift disclosures by disposition category in the current year, included in the annual compliance report.

---

## DF-08 — Corporate Opportunity & Tie-Ins {#df-08-corporate-opportunity-tie-ins}

**WHY (Reg cite):** [12 CFR §563.201](https://www.ecfr.gov/current/title-12/part-563/section-563.201) prohibits directors, officers, and other fiduciaries from taking advantage of corporate opportunities belonging to the credit union. A corporate opportunity belongs to the credit union if it is within its corporate authority and of present or potential practical advantage. A disinterested and independent majority of the Board may reject the opportunity as a matter of sound business judgment, after full and fair presentation, to establish that no usurpation occurred. [12 USC §1464(q)](https://www.law.cornell.edu/uscode/text/12/1464) and [12 USC §2608](https://www.law.cornell.edu/uscode/text/12/2608) prohibit prohibited tie-in arrangements conditioning credit union products or services on the purchase of additional products from the credit union or its affiliates, or on the customer's use of a particular title company in a federally related mortgage transaction.

**SYSTEM BEHAVIOR:** When a covered person identifies a business opportunity that may belong to the credit union, they must disclose it to the CCO and present it fully to the Board before pursuing it personally or through a related party. The Board's rejection (or acceptance) is documented as a matter of sound business judgment. If the Board rejects the opportunity, the covered person may pursue it; if the Board accepts it, the opportunity belongs to the credit union. Tie-in conditions in any credit union product, service, or pricing arrangement are prohibited; the system flags any transaction terms that condition a product on the purchase of another product from the credit union or an affiliate. The CCO and Legal are the write-authorized roles for corporate opportunity and tie-in records.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Corporate opportunity identified by covered person (`corp_opportunity.identified`) | Opportunity description (`corp_opportunity.description`); authority assessment (whether within credit union's corporate authority) (`corp_opportunity.authority_assessment`); covered person identity (`covered_person.id`) | Opportunity presented to Board (`corp_opportunity.presented`); Board vote scheduled | Before personal pursuit of the opportunity |
| Board votes on corporate opportunity (`corp_opportunity.board_voted`) | Full and fair presentation to disinterested Board; Board vote outcome; disinterested quorum (`board.disinterested_quorum`) | Disposition logged (`corp_opportunity.disposition_logged`); Board minutes updated (`board.minutes_recorded`) | At time of Board action |
| Tie-in condition detected in transaction terms (`tiein.flagged`) | Transaction terms (`tiein.transaction_terms`); condition description (`tiein.condition_description`) | Tie-in flagged (`tiein.flagged`); CCO review initiated; transaction blocked pending resolution | Before transaction execution |
| Tie-in review completed (`tiein.review_logged`) | CCO determination; corrective action if applicable | Review logged (`tiein.review_logged`); transaction released or blocked | Within 5 business days of flag |

**ALERTS/METRICS:** Alert fires when a corporate opportunity disclosure has been open for more than 10 business days without a Board disposition (target: zero). Alert fires on any `tiein.flagged` event (target: zero tie-in conditions in executed transactions). Metric: count of corporate opportunity disclosures and tie-in flags in the current year, reported annually.

---

## DF-09 — Recordkeeping & Reporting {#df-09-recordkeeping-reporting}

**WHY (Reg cite):** [12 CFR §215.8](https://www.ecfr.gov/current/title-12/part-215/section-215.8) requires annual preparation of a record of all insiders and their related interests, reviewed by insiders for completeness. [12 CFR §215.11](https://www.ecfr.gov/current/title-12/part-215/section-215.11) and [12 CFR §215.23](https://www.ecfr.gov/current/title-12/part-215/section-215.23) require public disclosure of insider credit on written request, with a 2-year retention of requests and dispositions. [12 CFR Part 223](https://www.ecfr.gov/current/title-12/part-223) requires records of all affiliate transactions. [18 USC §215](https://www.law.cornell.edu/uscode/text/18/215) and the Bank Bribery Guidelines require records of gift disclosures reported to the Board. Retention schedules for these records are governed by the Record Retention Policy.

**SYSTEM BEHAVIOR:** The system retains all COI disclosures, insider/related-interest records, affiliate transaction records, and gift disclosures in the compliance record store. Retention periods are governed by the Record Retention Policy (not this policy). Public requests for insider credit disclosure are logged, responded to promptly, and retained for 2 years from the date of the request (`insider.public_request_retention_expires_at`). The CCO is the write-authorized role for all compliance records under this policy; Legal has read access. Records are indexed by covered person, year, and record type to support examiner access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual insider/related-interest record finalized (`insider_report.published`) | Completed insider record (`insider.record_compiled`); insider confirmations of completeness | Record published and retained (`insider_report.published`) | Annually |
| Affiliate transaction record archived (`affiliate.transaction_file_archived`) | Transaction details: affiliate identity (`affiliate.list_entry`), transaction type (`affiliate.transaction_type`), amount (`affiliate.transaction_amount`), limit utilization (`affiliate.limit_utilization`), LQA status (`affiliate.asset_quality_classification`), collateral (`affiliate.collateral_type`, `affiliate.collateral_value`), market-terms basis (`affiliate.market_terms_basis`) | Transaction record archived (`affiliate.transaction_file_archived`) | At time of transaction execution |
| Public written request for insider credit disclosure received (`insider.public_disclosure_requested`) | Written request document (`insider.public_request`); requester identity; prior calendar year correspondent credit data (`insider.correspondent_credit_data`) | Disclosure issued if threshold met (`insider.public_disclosure_issued`); request and disposition retained (`insider.public_request_retention_expires_at`) | Promptly; retention for 2 years from request date |
| Gift board report compiled (`gift.board_report_issued`) | All gift disclosure records since last report | Board report issued and retained (`gift.board_report_issued`) | Periodically; at minimum annually |

**ALERTS/METRICS:** Alert fires when a public insider credit disclosure request has been open for more than 10 business days without disposition (target: zero). Metric: count of affiliate transaction records archived in the current year, reconciled against executed transactions quarterly.

---

## DF-10 — Training, Acknowledgment & Enforcement {#df-10-training-acknowledgment-enforcement}

**WHY (Reg cite):** [12 CFR §701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4) requires directors to attain financial literacy within 6 months of election or appointment (addressed in [DF-01](#df-01-fiduciary-duties)). Sound governance practice and the credit union's duty to enforce this policy require annual distribution, signed acknowledgment, and training. Enforcement authority for willful violations derives from the Board's general disciplinary authority and applicable federal law, including [18 USC §215](https://www.law.cornell.edu/uscode/text/18/215) for bribery violations.

**SYSTEM BEHAVIOR:** At the start of each calendar year, the system distributes the current policy to all directors and executive officers and creates an acknowledgment task for each covered person. Signed acknowledgments are collected and retained. Annual training is assigned to all covered persons; completion is tracked and reported to the Board. New directors and officers receive the policy and must sign an acknowledgment upon election, appointment, or promotion. Willful violations are escalated to the Board for disciplinary action: directors may be required to return benefits received and resign; officers may be required to return benefits and are subject to dismissal. The CCO documents all sanctions. The CCO is the write-authorized role for acknowledgment records, training completion records, and sanction records.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual policy distribution and acknowledgment cycle opens (`policy.training_cycle_opened`) | Current policy version (`policy.document_version`); covered-person roster (`covered_person.id[]`) | Policy distributed to all directors and officers (`policy.distribution_logged`); acknowledgment task created for each covered person (`policy.acknowledgment_due_at`) | Start of calendar year; acknowledgments due within 30 days |
| Covered person signs annual acknowledgment (`policy.acknowledgment.signed`) | Covered person identity (`covered_person.id`); policy version (`policy.document_version`); signature and date (`coi.attestation_signature`, `coi.attestation_date`) | Acknowledgment record retained (`policy.acknowledgment_record`) | Within 30 days of distribution |
| New director or officer elected, appointed, or promoted (`employee.role_changed`) | Covered person identity (`covered_person.id`); policy version (`policy.document_version`) | Policy distributed (`policy.distribution_logged`); onboarding acknowledgment filed (`policy.onboarding_acknowledgment_filed`) | Upon election, appointment, or promotion |
| Annual training cycle opens (`training.annual_cycle_opened`) | Covered-person roster (`covered_person.id[]`); training curriculum (`training.board_curriculum`) | Training assigned to all covered persons (`training.annual_assigned`); completion deadline set (`training.annual_due_at`) | Start of calendar year; completion due within 60 days |
| Training completed by covered person (`training.completed`) | Covered person identity (`covered_person.id`); module completed (`training.module_id`); assessment score if applicable (`training.assessment_score`) | Completion recorded (`training.completion_recorded`) | Within 60 days of cycle open |
| Willful violation identified and escalated (`policy.violation_escalated`) | Violation description (`policy.violation_description`); covered person identity (`covered_person.id`); evidence; CCO recommendation | Escalation created (`escalation.created`); Board sanction decision recorded (`policy.sanction_recorded`); benefits return demanded if applicable; resignation or dismissal actioned as appropriate | As soon as practicable after determination |

**ALERTS/METRICS:** Alert fires when any covered person's acknowledgment task reaches `overdue` status (target: 100% acknowledgment within 30 days). Alert fires when any covered person's annual training task reaches `overdue` status (target: 100% completion within 60 days). Metric: acknowledgment and training completion rates reported to the Board at the first meeting following each deadline.

---

## Governance & Sign-Off {#governance}

| Role | Responsibility |
|---|---|
| **Patrick Wilson, Chief Compliance Officer** | Policy owner; maintains controls DF-01 through DF-10; approves all conflict determinations, gift dispositions, and sanction records; sole write-authorized role for COI register, insider records, affiliate transaction records, and gift register |
| **Board of Directors** | Approves this policy annually; makes all conflict determinations on matters involving covered persons; approves insider credit above thresholds (excluding interested director); receives periodic reports on insider credit, affiliate transactions, gift disclosures, and training/acknowledgment completion |
| **Legal / General Counsel** | Confirms operative charter type and applicable regulatory thresholds (federal vs. state); reviews affiliate transaction exemption requests; approves corporate opportunity dispositions; read access to all compliance records |
| **Supervisory Committee** | Independent oversight of compliance with this policy; reviews COI register and insider credit records at least annually |

**Review cadence:** This policy is reviewed annually by the CCO and approved by the Board. Material regulatory changes trigger an off-cycle review. The next scheduled review is 2027-07-01.

**Cross-references:**
- Lending Policy — insider loan underwriting and operational process
- Compliance Policy — general compliance governance, whistleblower, complaint intake
- Record Retention Policy — retention schedules for disclosures and director records
- Reimbursement, Insurance and Indemnification Policy — director/officer indemnification and insurance
- Resolution Policy — Board resolutions, bylaws, general governance mechanics
- Third-Party Risk Policy — enterprise affiliate/vendor risk beyond Reg W transaction limits

---

## Assumptions & Gaps {#assumptions}

- **Charter type and operative regulatory thresholds must be confirmed by Legal.** This policy cites [12 CFR §701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4) (NCUA director duties, federal credit unions) and [12 CFR Part 215 (Regulation O)](https://www.ecfr.gov/current/title-12/part-215) as the primary authorities. If Pynthia Credit Union is a federal charter, §701.4 applies directly and the Board-approval trigger for insider credit under [12 CFR §701.21(d)](https://www.ecfr.gov/current/title-12/part-701/section-701.21) ($20,000 plus pledged shares) may be the operative threshold rather than the Reg O $25,000/5%/$500,000 thresholds. If Pynthia is a state charter, the applicable state financial code (e.g., California Financial Code, examined by DFPI) and California Corporations Code §§309 and 310 may supplement or replace federal citations. Legal must confirm and this policy must be updated accordingly before the effective date.

- **Regulation W applicability to credit unions must be confirmed by Legal.** [12 CFR Part 223 (Regulation W)](https://www.ecfr.gov/current/title-12/part-223) applies directly to member banks of the Federal Reserve System. Its application to credit unions is by analogy through NCUA safety-and-soundness authority or through state law. Legal must confirm the operative authority and whether any NCUA-specific affiliate transaction rule applies to Pynthia.

- **12 CFR §§563.200 and 563.201 (OTS regulations) are cited from the reference policy.** These provisions applied to federal savings associations under OTS. Their applicability to credit unions is by analogy; the NCUA equivalent authorities (§701.4 and general safety-and-soundness standards) are the primary citations. Legal should confirm whether §§563.200 and 563.201 are cited as persuasive authority or whether a direct NCUA equivalent exists.

- **De minimis gift threshold (Exhibit C) is not defined in this policy.** Patrick's notes reference Exhibit C for gift/entertainment thresholds but do not specify the dollar amount. The CCO must define and approve the threshold before the effective date. A common benchmark is $25–$50 per occurrence; the threshold must be consistent with [18 USC §215](https://www.law.cornell.edu/uscode/text/18/215) and the Bank Bribery Guidelines (52 Fed. Reg. 43941 (1987)).

- **Exhibits A, B, and C are referenced but not included in this policy.** Exhibit A (annual COI questionnaire), Exhibit B (ad-hoc disclosure form), and Exhibit C (gift policy and thresholds) are maintained as separate artifacts. Their content must be consistent with this policy and approved by the CCO before the effective date.

- **Engineering vocabulary is provisional.** The lending-side and governance-side resources, fields, and events referenced in the EVENTS tables throughout this document (including `covered_person.*`, `coi.*`, `insider.*`, `affiliate.*`, `corp_opportunity.*`, `tiein.*`, `gift.*`, `cu.unimpaired_capital_surplus`, and related codes) are drawn from the registered core-API vocabulary where registered subjects and events exist. Codes that are not yet registered in `core-vocabulary.json` follow the Composition grammar (registered subject + registered verb) and are the target naming scheme. All such codes will be confirmed by engineering before the next review. Specifically: `cu.unimpaired_capital_surplus` is registered; `covered_person.*`, `coi.*`, `insider.*`, `affiliate.*`, `corp_opportunity.*`, `tiein.*`, and `gift.*` subjects and their fields are registered in the vocabulary and used as specified. No new subjects have been minted.

- **Aggregate insider credit limit board resolution for small institutions.** [12 CFR §215.4(d)](https://www.ecfr.gov/current/title-12/part-215/section-215.4) permits the Board of an institution with deposits under $100 million to increase the aggregate insider limit to up to 2× unimpaired capital and surplus by annual resolution, subject to conditions. This policy does not pre-authorize that increase; if Pynthia wishes to use this authority, the Board must adopt a compliant annual resolution and this policy must be updated to reflect it.

- **Executive officer credit — additional limits.** [12 CFR §215.4(d)](https://www.ecfr.gov/current/title-12/part-215/section-215.4) imposes purpose-specific and amount-specific limits on credit to executive officers (education, residence, permissible security, and a 2.5%/$25,000/$100,000 general limit). These limits are incorporated by reference in DF-05 but are not enumerated in detail in this policy. The Lending Policy must implement the operational controls for these limits; this policy establishes the governance framework.

- **Overdraft provisions for executive officers and directors.** [12 CFR §215.4(e)](https://www.ecfr.gov/current/title-12/part-215/section-215.4) requires a written, interest-bearing, preauthorized credit plan for overdrafts of executive officers and directors, with a $1,000/$5-business-day inadvertent overdraft exception. These operational controls are delegated to the Lending Policy; this policy establishes the prohibition on non-compliant overdrafts.

- **Financial literacy training content and delivery.** This policy requires attainment of financial literacy within 6 months of election or appointment but does not specify the training curriculum or delivery method. The CCO must define the curriculum (consistent with [12 CFR §701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4)) and register it in the training system before the effective date.

- **Impartiality duty operational implementation.** The duty of impartiality (fair administration without discrimination in favor of or against any particular member) under [12 CFR §701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4) is stated as a fiduciary duty in DF-01 but does not have a separate operational control in this policy. Complaints alleging discriminatory treatment by directors are handled under the Compliance Policy. If a pattern of impartiality violations is identified, the CCO will escalate to the Board under DF-10.
