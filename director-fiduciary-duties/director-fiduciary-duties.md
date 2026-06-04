---
title: Director Fiduciary Duties Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Fiduciary Duties, Conflicts of Interest, Insider Transactions, Reg O, Reg W, Bank Bribery]
---

# Director Fiduciary Duties Policy

## General Policy Statement

Every director, executive officer, principal shareholder, and any employee or contractor with the power to direct the management or policies of Pynthia Credit Union (collectively, "covered persons") owes the credit union fiduciary duties of loyalty, care, good faith, confidentiality, and continuing disclosure. The core risk this policy controls is self-dealing — undisclosed conflicts that advance a covered person's interests at the credit union's expense — together with the regulatory limits on insider credit ([Regulation O](https://www.ecfr.gov/current/title-12/part-215)), affiliate transactions ([Regulation W](https://www.ecfr.gov/current/title-12/part-223)), and bank bribery ([18 U.S.C. §215](https://www.law.cornell.edu/uscode/text/18/215)). Conflict-of-interest disclosure is the primary operational mechanism implementing the duty of loyalty; the remaining controls bound the transactions where self-dealing is most likely to occur. The Chief Compliance Officer administers this policy; the Board of Directors, Legal/General Counsel, and the Supervisory Committee are required participants.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Annual disclosure questionnaire | Annual disclosure cycle opens (`coi.annual_cycle_opened`) | 30 days from cycle open | Exhibit A questionnaire | [DF-03](#df-03-annual-and-continuing-disclosure) |
| Ad-hoc conflict disclosure | Covered person identifies a new or potential conflict (`coi.conflict_identified`) | Before the matter is discussed or voted; no later than 5 business days after identification | Exhibit B ad-hoc form | [DF-03](#df-03-annual-and-continuing-disclosure) |
| Recusal on conflicted matter | Conflicted matter reaches Board agenda (`board.agenda_item_flagged_conflicted`) | Before discussion begins at the meeting | Board minutes recusal record | [DF-04](#df-04-management-of-conflicts) |
| Prior Board approval of insider credit | Aggregate insider credit will exceed the greater of $25,000 or 5% of unimpaired capital and surplus, or $500,000 (`insider.credit_threshold_exceeded`) | Before the credit union is legally bound | Board resolution (interested director excluded) | [DF-05](#df-05-insider-transactions-reg-o) |
| Report of executive-officer credit | Extension of credit to an executive officer made (`insider.credit_extended`) | Next regular Board meeting | Board report of insider credit | [DF-05](#df-05-insider-transactions-reg-o) |
| Affiliate list refresh | Annual affiliate review cycle opens (`affiliate.list_review_opened`) | At least annually | Affiliate list and related-interest record | [DF-06](#df-06-transactions-with-affiliates-reg-w) |
| Insider/related-interest record review | Annual insider survey issued (`insider.survey_issued`) | At least annually; insiders confirm within 30 days | Insider and related-interest record | [DF-09](#df-09-recordkeeping-and-reporting) |
| Gift/benefit disclosure beyond threshold | Offer or receipt of anything of value beyond Exhibit C thresholds (`gift.disclosure_submitted`) | 5 business days from offer or receipt | Exhibit C gift disclosure record | [DF-07](#df-07-bank-bribery-gifts-and-kickbacks) |
| Public disclosure of insider credit | Written request from a member of the public received (`insider.public_disclosure_requested`) | Within a reasonable time of request; request and disposition retained 2 years | Public disclosure response | [DF-09](#df-09-recordkeeping-and-reporting) |
| Annual acknowledgment and training | Annual training cycle opens (`policy.training_cycle_opened`) | 30 days from cycle open | Signed acknowledgment + training completion record | [DF-10](#df-10-training-acknowledgment-and-enforcement) |

## DF-01 — The Fiduciary Duties {#df-01-the-fiduciary-duties}

**WHY (Reg cite):** Federal conflicts-of-interest standards for insured depository institution fiduciaries ([12 CFR §563.200](https://www.law.cornell.edu/cfr/text/12/563.200), as carried forward in supervisory expectations) and the director duty-of-care standard in [California Corporations Code §309](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CORP&sectionNum=309) ground the duties of loyalty, care, good faith, confidentiality, and disclosure that covered persons owe the credit union.

**SYSTEM BEHAVIOR:** This control defines the five duties every covered person must observe: **loyalty** (act in the credit union's best interest, never personal interest), **care** (informed decision-making — attend meetings, review Board materials before voting), **good faith** (no fraud, intentional misconduct, or knowing violations of law), **confidentiality** (protect non-public credit union and member information), and **disclosure** (proactive, continuing disclosure of conflicts — operationalized in [DF-03](#df-03-annual-and-continuing-disclosure)). Each covered person's acceptance of these duties is captured in the annual acknowledgment under [DF-10](#df-10-training-acknowledgment-and-enforcement). Board-material distribution and meeting attendance are tracked so the duty of care is evidenced, not merely asserted; a director who has not received the meeting package may not vote on the matters it covers. The duties register and covered-person roster are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Covered person appointed, elected, hired, or promoted into scope (`covered_person.designated`) | Person identity (`covered_person.id`), role and capacity (`covered_person.role`), effective date (`covered_person.effective_date`) | Covered-person roster entry + policy copy issued (`covered_person.roster_updated`) | 10 business days from designation (internal SLA) |
| Board meeting package distributed (`board.package_distributed`) | Meeting date (`board.meeting_date`), agenda items (`board.agenda_items[]`), recipient list (`board.package_recipients[]`) | Distribution receipt per director (`board.package_receipt_logged`) | At least 5 calendar days before the meeting (internal SLA) |
| Board meeting held (`board.meeting_held`) | Attendance roll (`board.attendance[]`), votes cast (`board.votes[]`) | Attendance and voting record in minutes (`board.minutes_recorded`) | Minutes approved at next regular meeting |

**ALERTS/METRICS:** Roster completeness (every director/officer on the covered-person roster within 10 business days — target 100%); director attendance rate per rolling 12 months with an alert when any director falls below 75%; count of votes cast by directors who lacked a package receipt — target zero.

## DF-02 — Conflict Identification & General Duties {#df-02-conflict-identification-and-general-duties}

**WHY (Reg cite):** [12 CFR §563.200](https://www.law.cornell.edu/cfr/text/12/563.200) requires that persons in a position to direct management not advance their own interests at the institution's expense, disclose all material information on matters in which they have an interest, and refrain from participating in the related discussion or vote; [California Corporations Code §310](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CORP&sectionNum=310) sets the validation standard for interested-director transactions.

**SYSTEM BEHAVIOR:** Covered persons must not advance their own interests, or those of related parties (immediate family, controlled companies, business associates), at the credit union's expense. When a covered person has any interest in a matter before the Board, they must disclose to the Board all material non-privileged information — the nature and extent of the interest and the facts known about the matter — and must not participate in the Board's discussion of, or vote on, that matter. Covered persons must avoid even the appearance of a conflict; where a relationship merely looks conflicted, the same disclosure path applies and the Board determines whether a conflict exists. Known or potential conflicts are reported to the Chief Compliance Officer (or, if the CCO is conflicted, to the Board Chair). The conflict register is write-restricted to Compliance; covered persons may view only their own entries.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Covered person identifies a known or potential conflict (`coi.conflict_identified`) | Reporter identity (`covered_person.id`), counterparty/related party (`coi.related_party`), nature and extent of interest (`coi.interest_description`), affected matter (`coi.matter_reference`) | Conflict register entry opened (`coi.register_entry_created`) | 5 business days from identification (internal SLA) |
| Board determines whether a conflict exists (`coi.determination_made`) | Register entry (`coi.register_entry_id`), disclosed facts (`coi.interest_description`), disinterested-director vote (`board.votes[]`) | Determination recorded in minutes and register (`coi.determination_logged`) | At the meeting where the matter is first considered |

**ALERTS/METRICS:** Aging alert on conflict register entries open without a Board determination beyond 30 days; count of matters voted on where a register entry existed but no recusal was recorded — target zero; quarterly trend of new conflict identifications by role.

## DF-03 — Annual & Continuing Disclosure {#df-03-annual-and-continuing-disclosure}

**WHY (Reg cite):** [12 CFR §215.8](https://www.ecfr.gov/current/title-12/part-215/section-215.8) (Regulation O) requires an annual record of insiders and their related interests, maintained through annual surveys and updated for changes; [12 CFR §563.200](https://www.law.cornell.edu/cfr/text/12/563.200) grounds the continuing duty to disclose interests as they arise.

**SYSTEM BEHAVIOR:** Each director and officer completes the annual disclosure questionnaire (Exhibit A) covering services or property provided to or purchased from the credit union, direct or indirect interests in transactions, indebtedness, benefits over the materiality threshold, pending legal proceedings, and any other situation warranting Board examination. Disclosure is a continuing obligation: when a conflict or material change arises mid-year, the covered person files the ad-hoc disclosure form (Exhibit B) without waiting for the next annual cycle. Compliance compiles the annual record of insiders and their related interests and circulates it to insiders, who review it for completeness and accuracy. Non-responders are escalated to the Board Chair after the response deadline. Completed questionnaires and the insider record are confidential, released within the credit union on a need-to-know basis only, and write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual disclosure cycle opens (`coi.annual_cycle_opened`) | Covered-person roster (`covered_person.id` list), Exhibit A form version (`coi.questionnaire_version`) | Questionnaire issued to each covered person (`coi.questionnaire_issued`) | Issued within 5 business days of cycle open (internal SLA) |
| Covered person submits annual questionnaire (`coi.questionnaire_submitted`) | Completed responses (`coi.questionnaire_responses`), signature and date (`coi.attestation_signature`, `coi.attestation_date`) | Filed disclosure + register updates for any reported interests (`coi.disclosure_filed`) | 30 days from cycle open (enforced by `coi.questionnaire_due_at`) |
| Mid-year conflict or material change arises (`coi.conflict_identified`) | Exhibit B form (`coi.adhoc_form`), nature of change (`coi.interest_description`) | Ad-hoc disclosure filed and register updated (`coi.adhoc_disclosure_filed`) | Before participation in any related matter; no later than 5 business days |
| Annual insider/related-interest record compiled (`insider.record_compiled`) | All filed disclosures (`coi.disclosure_filed` set), prior-year record (`insider.record_prior`) | Insider and related-interest record circulated for insider review (`insider.record_circulated`) | At least annually; insider confirmations within 30 days |

**ALERTS/METRICS:** Questionnaire completion rate at the 30-day deadline (target 100%) with an escalation list of non-responders to the Board Chair; count of conflicts discovered through channels other than self-disclosure — target zero; median days from conflict identification to ad-hoc filing.

## DF-04 — Management of Conflicts {#df-04-management-of-conflicts}

**WHY (Reg cite):** [12 CFR §563.200](https://www.law.cornell.edu/cfr/text/12/563.200) requires non-participation in discussion and abstention from voting on matters in which a fiduciary has an interest; [12 CFR §215.4(b)](https://www.ecfr.gov/current/title-12/part-215/section-215.4#p-215.4(b)) (Regulation O) likewise bars the interested party from participating directly or indirectly in Board deliberations or voting on insider credit, including any attempt to influence the vote.

**SYSTEM BEHAVIOR:** Once a matter is determined (or presumed pending determination) to involve a conflict, the interested person is recused: they may make a factual presentation if the Board requests one, but must leave the meeting for the discussion and vote, must abstain from voting, and may not attempt to influence deliberations directly or indirectly. The Board Chair may appoint a disinterested person or committee to independently review alternatives, including competitive bids or comparable valuations. The disinterested majority of the Board then determines whether the transaction is fair, reasonable, and in the credit union's best interest, and that determination — together with who disclosed, who was present, and the votes taken — is recorded in the minutes. A conflicted transaction may proceed only after full disclosure, exclusion of the interested person, existence of a competitive bid or comparable valuation where applicable, and an affirmative Board determination. Recusal records in the conflict register are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Conflicted matter placed on Board agenda (`board.agenda_item_flagged_conflicted`) | Register entry (`coi.register_entry_id`), interested person (`covered_person.id`), matter description (`coi.matter_reference`) | Recusal notice to interested person + flagged agenda (`coi.recusal_noticed`) | Before the meeting package is distributed (internal SLA) |
| Interested person recused at meeting (`coi.recusal_executed`) | Attendance roll (`board.attendance[]`), departure/abstention record (`coi.recusal_record`) | Minutes entry documenting exclusion and abstention (`coi.recusal_logged`) | Before discussion of the matter begins |
| Disinterested Board votes on conflicted matter (`coi.conflicted_matter_voted`) | Independent review or comparable valuation (`coi.independent_review`), disinterested votes (`board.votes[]`) | Board determination of fairness and best interest (`coi.determination_logged`) | At the meeting; minutes approved at next regular meeting |

**ALERTS/METRICS:** Count of conflicted matters decided without a logged recusal — target zero; count of conflicted transactions approved without an independent review or comparable valuation on file; time from conflict flag to Board determination, alerting beyond 60 days.

## DF-05 — Insider Transactions (Reg O) {#df-05-insider-transactions-reg-o}

**WHY (Reg cite):** Federal Reserve Act §§22(g) and 22(h) as implemented by Regulation O — [12 CFR §215.4(a)](https://www.ecfr.gov/current/title-12/part-215/section-215.4#p-215.4(a)) (market terms and standards), [§215.4(b)](https://www.ecfr.gov/current/title-12/part-215/section-215.4#p-215.4(b)) (prior Board approval thresholds), [§215.4(c)](https://www.ecfr.gov/current/title-12/part-215/section-215.4#p-215.4(c)) (individual lending limit), [§215.4(d)](https://www.ecfr.gov/current/title-12/part-215/section-215.4#p-215.4(d)) (aggregate limit), and [§215.6](https://www.ecfr.gov/current/title-12/part-215/section-215.6) (insider responsibility); see also [12 U.S.C. §375a](https://www.law.cornell.edu/uscode/text/12/375a) and [§375b](https://www.law.cornell.edu/uscode/text/12/375b).

**SYSTEM BEHAVIOR:** Extensions of credit to insiders (directors, executive officers, principal shareholders, and their related interests) must be made on substantially the same terms — including interest rate and collateral — and under underwriting standards no less stringent than those prevailing for comparable transactions with non-insiders, and must not involve more than normal repayment risk or other unfavorable features; credit extended under a benefit or compensation program widely available to employees on non-preferential terms is excepted. Prior approval by a majority of the entire Board, with the interested director excluded from deliberation and voting, is required before the credit union becomes legally bound whenever aggregate credit to the insider and their related interests would exceed the greater of $25,000 or 5% of unimpaired capital and surplus, or in any event $500,000; line-of-credit approvals are valid for 14 months. Credit to any one insider plus related interests may not exceed the single-borrower limit of 15% of unimpaired capital and surplus, plus an additional 10% for the portion fully secured by readily marketable collateral, and aggregate credit to all insiders must observe the aggregate insider limit. All extensions of credit to executive officers are reported promptly to the Board. No insider may knowingly receive, or permit a related interest to receive, credit not in compliance with these limits. Loan underwriting mechanics are governed by the Lending Policy; this control governs the insider-specific gates. The insider flag on borrower records and the threshold parameters are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Credit application received from an insider or related interest (`insider.credit_application_received`) | Insider status from record (`insider.record_entry`), proposed terms (`insider.proposed_terms`), comparable non-insider terms (`insider.comparable_terms`), aggregate outstanding credit (`insider.aggregate_credit_amount`) | Insider-terms parity check result (`insider.terms_parity_checked`) | Before underwriting decision |
| Aggregate insider credit would exceed approval threshold (`insider.credit_threshold_exceeded`) | Aggregate computation (`insider.aggregate_credit_amount`), unimpaired capital and surplus (`cu.unimpaired_capital_surplus`), Board quorum excluding interested director (`board.disinterested_quorum`) | Board resolution approving or denying, interested director excluded (`insider.board_approval_recorded`) | Before legal commitment; line-of-credit approval valid 14 months (tracked by `insider.loc_approval_expires_at`) |
| Extension of credit to an executive officer funded (`insider.credit_extended`) | Officer financial statement (`insider.officer_financial_statement`), funded terms (`insider.funded_terms`) | Report to the Board of the extension (`insider.board_report_issued`) | Promptly — next regular Board meeting (internal SLA) |
| Insider lending limits computed (`insider.limits_recomputed`) | Outstanding insider credit (`insider.aggregate_credit_amount`), capital figures (`cu.unimpaired_capital_surplus`), collateral marketability flags (`insider.collateral_marketability`) | Limit-utilization report (`insider.limit_report_issued`) | Quarterly (internal SLA) |

**ALERTS/METRICS:** Count of insider credits funded without a parity check or required Board approval on file — target zero; limit-utilization dashboard (individual 15%/+10% and aggregate limits) alerting at 80% utilization; count of line-of-credit approvals past the 14-month validity window still drawn against — target zero.

## DF-06 — Transactions With Affiliates (Reg W) {#df-06-transactions-with-affiliates-reg-w}

**WHY (Reg cite):** Federal Reserve Act §§23A and 23B as implemented by Regulation W — [12 CFR §223.11–223.12](https://www.ecfr.gov/current/title-12/part-223#subpart-B) (10% single-affiliate and 20% aggregate limits), [§223.14](https://www.ecfr.gov/current/title-12/part-223/section-223.14) (collateral requirements), [§223.15](https://www.ecfr.gov/current/title-12/part-223/section-223.15) (no purchase of low-quality assets), and [§§223.51–223.52](https://www.ecfr.gov/current/title-12/part-223#subpart-F) (market terms); see also [12 U.S.C. §371c](https://www.law.cornell.edu/uscode/text/12/371c) and [§371c-1](https://www.law.cornell.edu/uscode/text/12/371c-1).

**SYSTEM BEHAVIOR:** Covered transactions with any single affiliate are limited to 10% of unimpaired capital and surplus, and with all affiliates in the aggregate to 20%. Each credit transaction with an affiliate must be secured at inception by eligible collateral at the required market-value coverage ratios (100%–130% depending on collateral type), maintained as collateral amortizes; low-quality assets, affiliate-issued securities, and intangibles are not eligible collateral. The credit union may not purchase a low-quality asset from an affiliate unless an independent credit evaluation supported a purchase commitment made before the affiliate acquired the asset. All affiliate transactions must be on market terms — terms and credit standards at least as favorable to the credit union as comparable non-affiliate transactions, or good-faith equivalent terms where no comparable exists. Compliance maintains the affiliate list and updates it at least annually; a transaction with a counterparty on the affiliate list routes through the affiliate-limits check before commitment. Enterprise affiliate and vendor risk beyond these transaction limits is governed by the Third-Party Risk Policy. The affiliate list and limit parameters are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Covered transaction with an affiliate proposed (`affiliate.covered_transaction_proposed`) | Affiliate identity from list (`affiliate.list_entry`), transaction amount and type (`affiliate.transaction_amount`, `affiliate.transaction_type`), current utilization (`affiliate.limit_utilization`), capital figures (`cu.unimpaired_capital_surplus`) | Quantitative-limit and market-terms check result (`affiliate.limits_checked`) | Before legal commitment |
| Credit transaction with an affiliate funded (`affiliate.credit_transaction_funded`) | Collateral type and market value (`affiliate.collateral_type`, `affiliate.collateral_value`), required coverage ratio (`affiliate.required_coverage_ratio`) | Perfected-collateral record + transaction record (`affiliate.transaction_recorded`) | Collateral secured at the time of the transaction; coverage maintained continuously |
| Asset purchase from an affiliate proposed (`affiliate.asset_purchase_proposed`) | Asset classification (`affiliate.asset_quality_classification`), independent credit evaluation (`affiliate.independent_evaluation`) | Low-quality-asset screen result (`affiliate.lqa_screen_logged`) | Before purchase commitment |
| Annual affiliate list review opens (`affiliate.list_review_opened`) | Current affiliate list (`affiliate.list`), organizational-change inputs (`affiliate.org_change_notices[]`) | Updated affiliate list approved (`affiliate.list_updated`) | At least annually |

**ALERTS/METRICS:** Affiliate-limit utilization dashboard (per-affiliate 10% and aggregate 20%) alerting at 80%; count of covered transactions funded without a logged limits check — target zero; collateral coverage exceptions (coverage below required ratio) — target zero, alert immediately; affiliate-list age alert at 11 months since last update.

## DF-07 — Bank Bribery, Gifts & Kickbacks {#df-07-bank-bribery-gifts-and-kickbacks}

**WHY (Reg cite):** The Federal Bank Bribery Law, [18 U.S.C. §215](https://www.law.cornell.edu/uscode/text/18/215), criminalizes soliciting or receiving anything of value in connection with the business of a financial institution; the Guidelines for Compliance With the Federal Bank Bribery Law, 52 Fed. Reg. 43941 (1987), frame the de minimis exceptions and disclosure expectations this control implements.

**SYSTEM BEHAVIOR:** No covered person may solicit or accept, for themselves or any third party, anything of value from any person in connection with credit union business, before or after a transaction, other than bona fide salary, wages, fees, or compensation paid in the ordinary course. Permitted exceptions are limited to the de minimis categories and dollar thresholds defined in Exhibit C — items motivated by obvious family or personal relationships, reasonable business meals and entertainment the credit union would pay for as a business expense, loans from other institutions on customary terms, promotional items of reasonable value, generally available discounts, and customary gifts for recognized occasions — and nothing in excess of Exhibit C thresholds may be accepted without prior written approval of the Chief Compliance Officer. Any offer or delivery of value beyond what Exhibit C authorizes must be disclosed to the CCO whether or not accepted; the CCO maintains the written gift-disclosure record and reports it periodically to the Board. Questions about whether an item may be accepted are directed to the CCO before acceptance. The gift-disclosure record is write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Covered person offered or receives value beyond Exhibit C thresholds (`gift.disclosure_submitted`) | Recipient identity (`covered_person.id`), source and relationship (`gift.source_party`), description and estimated value (`gift.description`, `gift.estimated_value`), accepted or declined (`gift.disposition`) | Gift-disclosure record entry (`gift.record_entry_created`) | 5 business days from offer or receipt (internal SLA) |
| CCO rules on a pending acceptance request (`gift.approval_requested`) | Disclosure entry (`gift.record_entry_id`), Exhibit C threshold comparison (`gift.threshold_comparison`) | Written approval or denial (`gift.ruling_issued`) | 5 business days from request (internal SLA) |
| Periodic gift-record report compiled (`gift.board_report_compiled`) | Gift-disclosure record for the period (`gift.record_entries[]`) | Report to the Board (`gift.board_report_issued`) | Quarterly (internal SLA) |

**ALERTS/METRICS:** Count of gift disclosures per quarter with trend by source party; count of acceptances above Exhibit C thresholds without a prior CCO ruling — target zero; aging alert on approval requests open beyond 5 business days.

## DF-08 — Corporate Opportunity & Tie-Ins {#df-08-corporate-opportunity-and-tie-ins}

**WHY (Reg cite):** [12 CFR §563.201](https://www.law.cornell.edu/cfr/text/12/563.201) prohibits fiduciaries from taking advantage of corporate opportunities belonging to the institution unless a disinterested, independent majority of the Board rejects the opportunity after full and fair presentation; the anti-tying provisions of [12 U.S.C. §1464(q)](https://www.law.cornell.edu/uscode/text/12/1464) and the RESPA title-insurance tie-in prohibition in [12 U.S.C. §2608](https://www.law.cornell.edu/uscode/text/12/2608) prohibit conditioning credit or services on prohibited reciprocal arrangements.

**SYSTEM BEHAVIOR:** A business opportunity belongs to the credit union if it is within the credit union's corporate authority and of present or potential practical advantage to it; no covered person may take such an opportunity for themselves or a related party unless it has first been presented fully and fairly to the Board and a disinterested, independent majority has rejected it as a matter of sound business judgment, with the rejection documented in the minutes. Separately, the credit union may not extend credit, lease or sell property, or furnish or price any service on the condition that the member obtain or provide additional credit, property, or services from or to the credit union or any affiliate (beyond conditions customary to the product, such as a share relationship required for a share-secured loan), or refrain from dealing with a competitor; nor may it participate in a real-estate credit transaction where it knows the seller required the purchaser to buy title insurance from a particular company. Suspected tie-in arrangements are escalated to the CCO and Legal/General Counsel for review before the transaction proceeds. Corporate-opportunity presentations and rejections are recorded in the Board minutes, which are write-restricted to the Board Secretary and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Corporate opportunity identified by or offered to a covered person (`corp_opportunity.identified`) | Opportunity description (`corp_opportunity.description`), relation to credit union authority and advantage (`corp_opportunity.authority_assessment`), interested person (`covered_person.id`) | Full and fair presentation to the Board (`corp_opportunity.presented`) | Before any covered person pursues the opportunity |
| Disinterested Board votes on the opportunity (`corp_opportunity.board_voted`) | Presentation record (`corp_opportunity.presented` reference), disinterested votes (`board.votes[]`) | Documented acceptance or rejection as sound business judgment (`corp_opportunity.disposition_logged`) | At the meeting of presentation; minutes approved at next regular meeting |
| Potential prohibited tie-in flagged (`tiein.flagged`) | Transaction terms (`tiein.transaction_terms`), conditioning description (`tiein.condition_description`) | CCO/Legal review determination (`tiein.review_logged`) | Before the conditioned transaction proceeds |

**ALERTS/METRICS:** Count of opportunities pursued by covered persons without a logged Board rejection — target zero; tie-in flags raised per quarter and their disposition latency, alerting on reviews open beyond 15 business days.

## DF-09 — Recordkeeping & Reporting {#df-09-recordkeeping-and-reporting}

**WHY (Reg cite):** [12 CFR §215.8](https://www.ecfr.gov/current/title-12/part-215/section-215.8) (annual record of insiders and related interests), [12 CFR §215.11](https://www.ecfr.gov/current/title-12/part-215/section-215.11) (public disclosure of insider credit on written request), and the recordkeeping expectations underlying [12 CFR Part 223](https://www.ecfr.gov/current/title-12/part-223) require records sufficient to demonstrate compliance with every limit and term requirement in this policy.

**SYSTEM BEHAVIOR:** Compliance retains: all annual and ad-hoc conflict disclosures and the conflict register; the annual insider and related-interest record (compiled at least annually, reviewed by insiders for completeness, supplemented by an annual survey of affiliated companies and a borrower insider-status indicator); records of every affiliate transaction identifying the affiliate, amount, limit position at the time, low-quality-asset status, collateral type and amount, and the basis for market-terms equivalence; and the gift-disclosure record. Upon written request from a member of the public, the credit union discloses the names of executive officers and principal shareholders (and their related interests) whose aggregate credit from correspondent institutions during the prior calendar year met the regulatory threshold (the lesser of 5% of unimpaired capital and surplus or $500,000; no disclosure is required if aggregate credit does not exceed $25,000, and individual amounts are not disclosed), and retains the request and its disposition for two years. Retention periods for these records (typically permanent for director records) follow the Record Retention Policy. All records in this control are write-restricted to Compliance; the Supervisory Committee has read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual insider survey issued (`insider.survey_issued`) | Insider roster (`insider.record_entry` set), affiliated-company list (`affiliate.list`) | Survey responses + updated insider/related-interest record (`insider.record_updated`) | At least annually; responses within 30 days (internal SLA) |
| Affiliate transaction recorded (`affiliate.transaction_recorded`) | Transaction details (`affiliate.transaction_amount`, `affiliate.transaction_type`), limit position (`affiliate.limit_utilization`), collateral record (`affiliate.collateral_value`), market-terms basis (`affiliate.market_terms_basis`) | Complete affiliate transaction file (`affiliate.transaction_file_archived`) | At transaction time; file complete within 10 business days (internal SLA) |
| Public written request for insider-credit disclosure received (`insider.public_disclosure_requested`) | Request document (`insider.public_request`), prior-calendar-year correspondent credit data (`insider.correspondent_credit_data`) | Disclosure response + retained request/disposition record (`insider.public_disclosure_issued`) | Within a reasonable time (internal: 30 days); request retained 2 years (tracked by `insider.public_request_retention_expires_at`) |

**ALERTS/METRICS:** Insider-record review completion rate at the 30-day mark (target 100%); count of affiliate transactions lacking a complete file after 10 business days — target zero; public-disclosure request aging alert at 20 days without response.

## DF-10 — Training, Acknowledgment & Enforcement {#df-10-training-acknowledgment-and-enforcement}

**WHY (Reg cite):** [12 CFR §563.200](https://www.law.cornell.edu/cfr/text/12/563.200) and the insider-responsibility provision of [12 CFR §215.6](https://www.ecfr.gov/current/title-12/part-215/section-215.6) presuppose that fiduciaries know and observe these standards; the Guidelines for Compliance With the Federal Bank Bribery Law, 52 Fed. Reg. 43941 (1987) (implementing [18 U.S.C. §215](https://www.law.cornell.edu/uscode/text/18/215)), direct institutions to communicate the prohibition and obtain awareness from all covered persons.

**SYSTEM BEHAVIOR:** This policy is distributed to every director and officer, and to each new director on election or appointment and each new officer on hire or promotion into scope. Each covered person signs an annual acknowledgment confirming receipt, understanding, and agreement to be governed by the policy, and completes annual fiduciary-duties training covering the five duties, conflict disclosure, Reg O/Reg W limits, and the bribery and gift rules. Suspected violations are escalated to the CCO, who investigates with Legal/General Counsel and reports findings to the Board; the affected person is informed of the basis for the concern and given an opportunity to explain before any determination. The Board may impose sanctions for willful violations: directors may be required to return any benefits received and to resign from the Board; officers may be required to return benefits and are subject to dismissal. Whistleblower and complaint-intake channels are governed by the Compliance Policy. Acknowledgment and training records are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual training cycle opens (`policy.training_cycle_opened`) | Covered-person roster (`covered_person.id` list), current policy version (`policy.version`) | Policy distributed + training assigned (`policy.distribution_logged`) | Within 5 business days of cycle open (internal SLA) |
| Covered person signs acknowledgment and completes training (`policy.acknowledgment_signed`) | Signed acknowledgment (`policy.acknowledgment_record`), training completion (`policy.training_completion_record`) | Filed acknowledgment and training record (`policy.compliance_record_filed`) | 30 days from cycle open (enforced by `policy.acknowledgment_due_at`) |
| New director elected or officer promoted into scope (`covered_person.designated`) | Roster entry (`covered_person.id`), policy copy (`policy.version`) | Onboarding distribution + initial acknowledgment (`policy.onboarding_acknowledgment_filed`) | 10 business days from designation (internal SLA) |
| Suspected willful violation escalated (`policy.violation_escalated`) | Allegation facts (`policy.violation_description`), subject identity (`covered_person.id`), investigation file (`policy.investigation_file`) | Board determination and any sanction — benefit return, resignation, or dismissal (`policy.sanction_recorded`) | Subject response opportunity before determination; Board action at next regular meeting after investigation closes |

**ALERTS/METRICS:** Acknowledgment and training completion rate at the 30-day deadline (target 100%) with non-completion escalation to the Board Chair; new-designee onboarding completion within 10 business days (target 100%); open violation investigations aging beyond 90 days — alert to the Supervisory Committee.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — administers the conflict register, insider and affiliate records, gift-disclosure record, and the annual disclosure, survey, and training cycles.
- **Approvers:** Patrick Wilson, Chief Compliance Officer. Board of Directors adoption is recorded in the minutes; the Board, Legal/General Counsel, and the Supervisory Committee are required participants in conflict determinations, violation investigations, and the annual review.
- **Review cadence:** Reviewed at least annually (next review per front-matter) and upon any material change to Regulation O, Regulation W, the Bank Bribery Law guidelines, or California corporate/financial law applicable to the credit union.
- **Cross-references:** Lending Policy (insider-loan underwriting mechanics); Compliance Policy (whistleblower and complaint intake); Record Retention Policy (retention schedules for disclosures and director records); Reimbursement, Insurance and Indemnification Policy (officer/director indemnification); Resolution Policy (Board resolutions and governance mechanics); Third-Party Risk Policy (enterprise affiliate/vendor risk beyond Reg W transaction limits).
- **Exhibits:** Exhibit A — Annual Conflict of Interest Disclosure Questionnaire; Exhibit B — Ad-Hoc Conflict Disclosure Form; Exhibit C — Gift and Entertainment Thresholds and Disclosure Form. Exhibits are maintained by Compliance and versioned with this policy.

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The parsed engineering spec (`vocabulary.json`, Cassandra Banking Core API) is banking-core only and registers no events; none of the governance-side codes used throughout this document (`coi.*`, `insider.*`, `affiliate.*`, `gift.*`, `corp_opportunity.*`, `tiein.*`, `board.*`, `covered_person.*`, `policy.*`, `cu.unimpaired_capital_surplus`, and the timer codes `coi.questionnaire_due_at`, `insider.loc_approval_expires_at`, `insider.public_request_retention_expires_at`, `policy.acknowledgment_due_at`) are yet registered. They are the target naming scheme and will be confirmed by engineering before the next review.
- **Charter-type authority mapping needs confirmation.** Regulation O (12 CFR Part 215) and Regulation W (12 CFR Part 223) by their terms apply to member banks; Pynthia is a credit union, and the equivalent NCUA provisions (e.g., 12 CFR §701.21(d) loans to officials, fiduciary-duty standards for federal charters, and California Financial Code duties for a DFPI-examined state charter) may be the operative citations. Patrick's notes direct the Reg O/Reg W thresholds, so this policy adopts them as binding internal standards; Legal should confirm the charter type and substitute or supplement citations accordingly. The same applies to 12 CFR §§563.200–563.201, which originated as OTS thrift rules.
- **Exhibit C thresholds are not yet set.** Patrick's notes require de minimis gift thresholds "within defined thresholds (Exhibit C)" but do not state dollar amounts. The reference materials use $50 as a customary de minimis figure; the CCO must set and approve the actual Exhibit C amounts before first distribution.
- **Aggregate insider limit value assumed.** The policy references "the aggregate insider limit" per Patrick's notes; consistent with Reg O, this is assumed to be 100% of unimpaired capital and surplus (with the small-institution election to raise it by annual Board resolution available where conditions are met). Confirm whether Pynthia intends to adopt the election.
- **Materiality threshold for benefit disclosure assumed at $1,000** in the annual questionnaire (Exhibit A), following the reference questionnaire. Confirm the figure with the CCO.
- **"Promptly" for executive-officer credit reports interpreted as the next regular Board meeting**; confirm whether a shorter internal SLA is desired.
- **Public-disclosure response time set internally at 30 days** — Reg O §215.11 requires disclosure on request without a stated deadline; the 30-day internal SLA is an assumption.
- **California Corporations Code §§309–310 applicability assumed** on the basis that Pynthia is a California-organized institution examined by the DFPI; confirm the state of organization.
- **Exhibits A, B, and C are referenced but not embedded**; they are maintained as separate controlled documents by Compliance and must exist before the first annual cycle opens.
