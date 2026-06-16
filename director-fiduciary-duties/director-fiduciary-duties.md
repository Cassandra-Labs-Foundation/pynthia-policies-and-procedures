---
title: Director Fiduciary Duties Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Fiduciary Duties, Conflicts of Interest, Reg O, Reg W, Insider Transactions]
---

## General Policy Statement

Pynthia Credit Union requires every director, executive officer, principal shareholder, and any employee or contractor with the power to direct its management or policy to discharge the full set of fiduciary duties owed to the credit union — loyalty, care, good faith, confidentiality, and the continuing obligation to disclose — and to never advance personal or related-party interests at the credit union's expense. Conflict-of-interest disclosure is the operational core of the duty of loyalty: covered persons must disclose material interests, recuse from related deliberations and votes, and observe the statutory limits on insider credit (Regulation O) and affiliate transactions (Regulation W). This policy is the umbrella over those duties; loan underwriting mechanics, general compliance governance, retention schedules, indemnification, and broader vendor risk live in their respective policies.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Annual disclosure questionnaire | Annual cycle opens (`coi.annual_cycle_opened`) | Returned within 30 days of issuance (internal SLA) | Exhibit A questionnaire | [FD-03](#fd-03-annual-and-continuing-disclosure) |
| Mid-year conflict arises | Covered person identifies a conflict (`coi.conflict_identified`) | Disclose before participating in any related matter | Exhibit B ad-hoc form | [FD-02](#fd-02-conflict-identification-and-general-duties) |
| Insider credit over threshold | Aggregate insider credit exceeds the greater of $25k/5% UCS, or $500k (`insider.credit_threshold_exceeded`) | Prior Board approval (excluding interested director) before funding | Board approval record | [FD-05](#fd-05-insider-transactions-reg-o) |
| Insider extension funded | Insider credit funded (`affiliate.credit_transaction_funded` / `insider.board_approval_recorded`) | Reported promptly to Board (next meeting) | Insider report to Board | [FD-05](#fd-05-insider-transactions-reg-o) |
| Affiliate covered transaction | Covered transaction proposed (`affiliate.covered_transaction_proposed`) | Limits/collateral checked before funding | Affiliate transaction record | [FD-06](#fd-06-transactions-with-affiliates-reg-w) |
| Gift/offer beyond de minimis | Offer received beyond Exhibit C threshold (`gift.disclosure_submitted`) | Disclose promptly; reported to Board periodically | Gift disclosure + Board report | [FD-07](#fd-07-bank-bribery-gifts-and-kickbacks) |
| Corporate opportunity presented | Opportunity identified (`corp_opportunity.identified`) | Board disposition documented before pursuit | Board disposition record | [FD-08](#fd-08-corporate-opportunity-and-tie-ins) |
| Public insider-credit request | Written public request received (`insider.public_disclosure_requested`) | Disclosed per Reg O on request; request retained 2 years | Public disclosure response | [FD-09](#fd-09-recordkeeping-and-reporting) |
| Annual acknowledgment & training | Annual policy/training cycle opens (`policy.training_cycle_opened`) | Signed acknowledgment + training completion within cycle | Acknowledgment + training record | [FD-10](#fd-10-training-acknowledgment-and-enforcement) |

## FD-01 — The Fiduciary Duties  {#fd-01-the-fiduciary-duties}

**WHY (Reg cite):** The duties of loyalty, care, good faith, confidentiality, and disclosure are the foundation of fiduciary conduct codified for thrift/credit-union officials at [12 CFR §563.200](https://www.ecfr.gov/current/title-12/part-563) (conflicts of interest) and the director duty-of-care and interested-transaction standards of [Cal. Corp. Code §309](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CORP&sectionNum=309) and [§310](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CORP&sectionNum=310).

**SYSTEM BEHAVIOR:** The policy defines and binds each covered person to the five duties and is the umbrella under which all downstream conflict, insider, and affiliate controls operate. The covered-person roster — who is a director, executive officer, principal shareholder, or other person with power to direct management or policy — is maintained as the authoritative population that every other control in this policy screens against; an individual excluded from major policy-making by Board resolution or bylaw is recorded on the roster as out-of-scope. The roster is write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Covered-population designated or changed (`covered_person.roster_updated`) | Person identity (`covered_person.id`), role (`covered_person.role`), effective date (`covered_person.effective_date`), designation flag (`covered_person.designated`) | Updated covered-person roster (`covered_person.roster_updated`) | — |

**ALERTS/METRICS:** Alert on any covered person active in the roster without a current signed acknowledgment (see [FD-10](#fd-10-training-acknowledgment-and-enforcement)); target zero unrostered directors or executive officers.

## FD-02 — Conflict Identification & General Duties  {#fd-02-conflict-identification-and-general-duties}

**WHY (Reg cite):** Covered persons must not advance personal or related-party interests at the credit union's expense, must disclose all material information on any interested matter, and must not participate in the related Board discussion or vote, per [12 CFR §563.200](https://www.ecfr.gov/current/title-12/part-563) and the interested-director standard of [Cal. Corp. Code §310](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CORP&sectionNum=310).

**SYSTEM BEHAVIOR:** When a covered person flags an interest in a Board matter, the system records the disclosure, marks the agenda item conflicted, and enforces recusal — the interested party may not participate in or attempt to influence deliberations and, for directors, may not vote. A material interest disclosed mid-year through the Exhibit B ad-hoc form (see [FD-03](#fd-03-annual-and-continuing-disclosure)) feeds the same recusal pipeline. Even the appearance of a conflict triggers the disclosure obligation. Recusal records and conflict registers are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Covered person identifies an interest in a Board matter (`coi.conflict_identified`) | Person identity (`covered_person.id`), interest description (`coi.interest_description`), matter reference (`coi.matter_reference`), related party (`coi.related_party`) | Conflict register entry (`coi.register_entry_created`) | Before participating in the matter (internal: same Board cycle) |
| Conflicted agenda item reached at Board (`board.minutes_recorded`) | Agenda item flagged (`board.agenda_item_flagged_conflicted`), recusal notice (`coi.recusal_noticed`), disinterested quorum (`board.disinterested_quorum`) | Recusal executed + logged (`coi.recusal_executed`) | At the meeting (internal: recorded in minutes) |

**ALERTS/METRICS:** Alert on any Board vote recorded where a flagged-conflicted member's recusal is missing (`coi.conflicted_matter_voted` true with no `coi.recusal_executed`); target zero conflicted votes without recusal.

## FD-03 — Annual & Continuing Disclosure  {#fd-03-annual-and-continuing-disclosure}

**WHY (Reg cite):** The continuing duty to disclose conflicts proactively — through an annual questionnaire and ad-hoc mid-year disclosure — implements the disclosure obligation under [12 CFR §563.200](https://www.ecfr.gov/current/title-12/part-563), and the annual insider/related-interest record is required by [12 CFR §215.8](https://www.ecfr.gov/current/title-12/part-215/section-215.8).

**SYSTEM BEHAVIOR:** Annually the system issues the Exhibit A questionnaire to every director and officer and tracks completion; mid-year, a covered person who discovers a conflict files the Exhibit B ad-hoc form, which routes into the [FD-02](#fd-02-conflict-identification-and-general-duties) recusal pipeline. Separately, the insider and related-interest record is compiled at least annually and circulated to insiders for completeness and accuracy review. Questionnaire responses, ad-hoc disclosures, and the insider record are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual disclosure cycle opens (`coi.annual_cycle_opened`) | Questionnaire version (`coi.questionnaire_version`), covered-person roster (`covered_person.id`), due date (`coi.questionnaire_due_at`) | Exhibit A questionnaires issued (`coi.questionnaire_issued`) | 30 days to return (enforced by `coi.questionnaire_due_at`) |
| Director/officer completes questionnaire (`coi.questionnaire_submitted`) | Responses (`coi.questionnaire_responses`), attestation signature (`coi.attestation_signature`), attestation date (`coi.attestation_date`) | Disclosure filed + certification (`coi.certified`) | Within annual cycle (enforced by `coi.certification_due`) |
| Conflict arises mid-year (`coi.adhoc_disclosure_filed`) | Ad-hoc form (`coi.adhoc_form`), interest description (`coi.interest_description`), related party (`coi.related_party`) | Ad-hoc disclosure filed (`coi.adhoc_disclosure_filed`) | Before participating in the matter |
| Annual insider/related-interest record compiled (`insider.record_updated`) | Prior record (`insider.record_prior`), new entries (`insider.record_entry`), circulation to insiders (`insider.record_circulated`) | Insider/related-interest record (`insider.record_updated`) | At least annually (enforced by `insider.survey_issued`) |

**ALERTS/METRICS:** Aging alert on questionnaires unreturned past `coi.questionnaire_due_at`; target 100% annual completion before cycle close and zero insiders without a reviewed related-interest record.

## FD-04 — Management of Conflicts  {#fd-04-management-of-conflicts}

**WHY (Reg cite):** Recusal, abstention, independent review, and a disinterested Board determination on conflicted matters are required so the interested party cannot influence the outcome, under [12 CFR §563.200](https://www.ecfr.gov/current/title-12/part-563) and the just-and-reasonable interested-transaction standard of [Cal. Corp. Code §310](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CORP&sectionNum=310).

**SYSTEM BEHAVIOR:** Once a conflict is registered (see [FD-02](#fd-02-conflict-identification-and-general-duties)), the system requires the matter to proceed only with a disinterested quorum, optionally an independent review, and a recorded Board determination on whether and how to proceed. The interested party is blocked from the deliberation and vote and may not attempt to influence either. Determination records are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Conflicted matter brought to Board for determination (`coi.determination_logged`) | Matter reference (`coi.matter_reference`), disinterested quorum (`board.disinterested_quorum`), independent review (`coi.independent_review`), recusal record (`coi.recusal_record`) | Board determination logged (`coi.determination_logged`) | At the meeting (internal: recorded in `board.minutes_recorded`) |

**ALERTS/METRICS:** Alert on any conflicted determination logged without a disinterested quorum; target zero determinations lacking documented recusal and quorum.

## FD-05 — Insider Transactions (Reg O)  {#fd-05-insider-transactions-reg-o}

**WHY (Reg cite):** Extensions of credit to insiders must be on substantially the same terms and underwriting as comparable non-insider transactions, require prior Board approval (excluding the interested director) above the greater of $25,000 or 5% of unimpaired capital and surplus, or $500,000, and observe the single-borrower (15% + 10% readily-marketable collateral) and aggregate insider limits, per [12 CFR §215.4](https://www.ecfr.gov/current/title-12/part-215/section-215.4) and [12 CFR §215.6](https://www.ecfr.gov/current/title-12/part-215/section-215.6); the underlying statutes are FRA §22(g)/(h) at [12 U.S.C. §375a](https://www.law.cornell.edu/uscode/text/12/375a) and [§375b](https://www.law.cornell.edu/uscode/text/12/375b).

**SYSTEM BEHAVIOR:** When a loan application is flagged as insider-related, the system screens terms for parity against comparable non-insider transactions and recomputes the applicant's aggregate credit (including related interests) against the single-borrower and aggregate insider limits. If aggregate credit exceeds the greater of $25,000 or 5% of unimpaired capital and surplus, or $500,000, prior approval of a majority of the entire Board excluding the interested director is required before funding; the interested party may not participate in or influence that vote. Funded extensions are reported promptly to the Board. Loan underwriting mechanics live in the Lending Policy; this control governs the parity, limit, approval, and reporting gates only. Insider terms, approval, and limit records are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Insider credit application received (`insider.credit_application_received`) | Proposed terms (`insider.proposed_terms`), comparable terms (`insider.comparable_terms`), aggregate credit (`insider.aggregate_credit_amount`), collateral marketability (`insider.collateral_marketability`) | Terms-parity check + limit recompute (`insider.terms_parity_checked`) | Before approval/funding |
| Aggregate insider credit exceeds threshold (`insider.credit_threshold_exceeded`) | Threshold-exceeded flag (`insider.credit_threshold_exceeded`), aggregate amount (`insider.aggregate_credit_amount`), unimpaired capital and surplus (`cu.unimpaired_capital_surplus`) | Board approval recorded, interested director excluded (`insider.board_approval_recorded`) | Prior to funding (internal: before `affiliate.credit_transaction_funded`) |
| Insider extension funded (`insider.board_report_issued`) | Funded terms (`insider.funded_terms`), recomputed limits (`insider.limits_recomputed`) | Insider report to Board (`insider.board_report_issued`) | Promptly — next Board meeting (enforced by `insider.report_due`) |

**ALERTS/METRICS:** Alert on any insider extension funded above threshold without a recorded prior Board approval, and on any single-borrower or aggregate limit breach; target zero unapproved over-threshold extensions and zero limit breaches.

## FD-06 — Transactions With Affiliates (Reg W)  {#fd-06-transactions-with-affiliates-reg-w}

**WHY (Reg cite):** Covered transactions with any single affiliate are capped at 10% and in the aggregate at 20% of unimpaired capital and surplus, must meet collateral and market-terms requirements, may not involve low-quality assets, and require an affiliate list updated at least annually, per [12 CFR §223.11–§223.14](https://www.ecfr.gov/current/title-12/part-223), [§223.15](https://www.ecfr.gov/current/title-12/part-223/section-223.15), and [§223.51](https://www.ecfr.gov/current/title-12/part-223/section-223.51); statutory basis is FRA §§23A/23B at [12 U.S.C. §371c](https://www.law.cornell.edu/uscode/text/12/371c) and [§371c-1](https://www.law.cornell.edu/uscode/text/12/371c-1).

**SYSTEM BEHAVIOR:** When a covered transaction with an affiliate is proposed, the system checks the single-affiliate (10%) and aggregate (20%) limits against unimpaired capital and surplus, verifies collateral coverage and market terms, and screens for low-quality assets before funding; a transaction failing any gate is blocked. The affiliate list is reviewed and updated at least annually and each transaction record is archived with its limit, collateral, and market-terms basis. Enterprise affiliate/vendor risk beyond these transaction limits lives in the Third-Party Risk Policy. The affiliate list and transaction records are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Covered transaction with affiliate proposed (`affiliate.covered_transaction_proposed`) | Transaction type (`affiliate.transaction_type`), amount (`affiliate.transaction_amount`), collateral type/value (`affiliate.collateral_type`, `affiliate.collateral_value`), market-terms basis (`affiliate.market_terms_basis`), asset-quality classification (`affiliate.asset_quality_classification`) | Limit/collateral/LQA check (`affiliate.limits_checked`) | Before funding |
| Affiliate credit transaction funded (`affiliate.credit_transaction_funded`) | Limit utilization (`affiliate.limit_utilization`), required coverage ratio (`affiliate.required_coverage_ratio`), transaction archive flag (`affiliate.transaction_file_archived`) | Affiliate transaction recorded (`affiliate.transaction_recorded`) | At funding (internal: archived same day) |
| Annual affiliate-list review opens (`affiliate.list_review_opened`) | Current list (`affiliate.list`), new/changed entries (`affiliate.list_entry`) | Affiliate list updated (`affiliate.list_updated`) | At least annually |

**ALERTS/METRICS:** Alert on any covered transaction breaching the 10% single-affiliate or 20% aggregate cap, any low-quality-asset purchase, and any affiliate list older than 12 months; target zero limit breaches and zero stale affiliate lists.

## FD-07 — Bank Bribery, Gifts & Kickbacks  {#fd-07-bank-bribery-gifts-and-kickbacks}

**WHY (Reg cite):** Soliciting or receiving anything of value in connection with credit union business is prohibited except de minimis gifts and entertainment within defined thresholds, with offers beyond those thresholds disclosed and reported, per the Federal Bank Bribery Law at [18 U.S.C. §215](https://www.law.cornell.edu/uscode/text/18/215) and the Guidelines for Compliance With the Federal Bank Bribery Law, 52 Fed. Reg. 43941 (1987).

**SYSTEM BEHAVIOR:** The system records gift/entertainment offers, compares each against the Exhibit C de minimis thresholds, and where an offer exceeds what is authorized requires the recipient to disclose it; permitted exceptions (family/personal-relationship gifts, reasonable business meals, customary promotional items, market-rate discounts) are logged but not escalated. Disclosed offers and their dispositions are compiled into a periodic Board report. Gift records and disclosures are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Gift/offer beyond de minimis received (`gift.disclosure_submitted`) | Source party (`gift.source_party`), estimated value (`gift.estimated_value`), threshold comparison (`gift.threshold_comparison`) | Gift record entry (`gift.record_entry_created`) | Promptly on receipt |
| Periodic gift records compiled for Board (`gift.board_report_issued`) | Record entries (`gift.record_entry_id`), disposition (`gift.disposition`) | Gift Board report (`gift.board_report_issued`) | Periodically (internal: each Board reporting cycle) |

**ALERTS/METRICS:** Alert on any above-threshold gift with no disclosure record; target zero undisclosed above-threshold gifts and timely periodic Board reporting.

## FD-08 — Corporate Opportunity & Tie-Ins  {#fd-08-corporate-opportunity-and-tie-ins}

**WHY (Reg cite):** Covered persons may not usurp corporate opportunities belonging to the credit union, and a disinterested Board may reject an opportunity as a matter of sound business judgment, per [12 CFR §563.201](https://www.ecfr.gov/current/title-12/part-563); prohibited tie-in arrangements are barred by HOLA tying at [12 U.S.C. §1464(q)](https://www.law.cornell.edu/uscode/text/12/1464) and RESPA at [12 U.S.C. §2608](https://www.law.cornell.edu/uscode/text/12/2608).

**SYSTEM BEHAVIOR:** When a covered person identifies an opportunity within the credit union's corporate authority and of present or potential advantage to it, the system requires full and fair presentation to the Board and records the disposition; a disinterested-majority rejection as sound business judgment is documented so the person is not deemed to have usurped the opportunity. Prohibited tie-in conditions are flagged and logged when detected in a transaction. Opportunity dispositions and tie-in reviews are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Corporate opportunity presented to Board (`corp_opportunity.disposition_logged`) | Opportunity description (`corp_opportunity.description`), authority assessment (`corp_opportunity.authority_assessment`), presentation flag (`corp_opportunity.presented`), Board vote (`corp_opportunity.board_voted`) | Opportunity disposition logged (`corp_opportunity.disposition_logged`) | Before the person pursues it (internal: recorded in `board.minutes_recorded`) |
| Prohibited tie-in condition detected (`tiein.flagged`) | Condition description (`tiein.condition_description`), transaction terms (`tiein.transaction_terms`) | Tie-in review logged (`tiein.review_logged`) | At detection |

**ALERTS/METRICS:** Alert on any opportunity pursued by a covered person without a documented Board disposition and on any flagged tie-in not reviewed; target zero usurped opportunities and zero unreviewed tie-in flags.

## FD-09 — Recordkeeping & Reporting  {#fd-09-recordkeeping-and-reporting}

**WHY (Reg cite):** The credit union must retain affiliate-transaction records, identify insiders and their related interests, and disclose insider credit to the public on written request, per [12 CFR §215.8](https://www.ecfr.gov/current/title-12/part-215/section-215.8), [§215.11](https://www.ecfr.gov/current/title-12/part-215/section-215.11), and the affiliate-transaction recordkeeping standard at [12 CFR §223.14](https://www.ecfr.gov/current/title-12/part-223/section-223.14).

**SYSTEM BEHAVIOR:** The system retains disclosures, insider/related-interest records (see [FD-03](#fd-03-annual-and-continuing-disclosure)), affiliate-transaction records (see [FD-06](#fd-06-transactions-with-affiliates-reg-w)), and gift disclosures (see [FD-07](#fd-07-bank-bribery-gifts-and-kickbacks)), and on receipt of a written public request discloses the names of executive officers and principal shareholders to whom correspondent-bank credit met the Reg O threshold; the request and its disposition are retained for two years. Detailed retention schedules (typically permanent for director records) live in the Record Retention Policy. Public-request records are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Written public insider-credit request received (`insider.public_disclosure_requested`) | Public request (`insider.public_request`), correspondent credit data (`insider.correspondent_credit_data`) | Public disclosure issued (`insider.public_disclosure_issued`) | On request; request + disposition retained 2 years (enforced by `insider.public_request_retention_expires_at`) |

**ALERTS/METRICS:** Alert on any public request without a recorded disposition and on any required record approaching its retention expiry without disposition; target 100% of public requests answered and retained.

## FD-10 — Training, Acknowledgment & Enforcement  {#fd-10-training-acknowledgment-and-enforcement}

**WHY (Reg cite):** Directors and officers must receive the policy, sign an annual acknowledgment, complete annual training, and be subject to escalation, removal, and Board sanctions for willful violations, grounded in the conflicts and corporate-opportunity standards at [12 CFR §563.200](https://www.ecfr.gov/current/title-12/part-563) and [§563.201](https://www.ecfr.gov/current/title-12/part-563), and the insider-responsibility rule at [12 CFR §215.6](https://www.ecfr.gov/current/title-12/part-215/section-215.6).

**SYSTEM BEHAVIOR:** Annually the system distributes the policy to all directors and officers, opens a training cycle, and tracks signed acknowledgments and training completion; new directors and officers receive the policy on election or hire. A confirmed willful violation routes to escalation and a recorded Board sanction — which may require return of benefits received, resignation for directors, or dismissal for officers. Acknowledgment records, sanctions, and the policy version register are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual policy/training cycle opens (`policy.training_cycle_opened`) | Document version (`policy.document_version`), covered-person roster (`covered_person.id`), training curriculum (`training.curriculum_id`) | Policy distributed + training assigned (`policy.distribution_logged`, `training.annual_assigned`) | Within annual cycle (enforced by `policy.acknowledgment_due_at`, `training.annual_due_at`) |
| Director/officer signs acknowledgment (`policy.acknowledgment_signed`) | Acknowledgment record (`policy.acknowledgment_record`), signer identity (`covered_person.id`) | Acknowledgment filed (`policy.acknowledgment_signed`) | Within annual cycle (enforced by `policy.acknowledgment_due_at`) |
| Willful violation confirmed (`policy.violation_escalated`) | Violation description (`policy.violation_description`), investigation file (`policy.investigation_file`) | Board sanction recorded (`policy.sanction_recorded`) | Per Board process (internal: recorded in `board.minutes_recorded`) |

**ALERTS/METRICS:** Aging alert on acknowledgments or training past their due dates; target 100% annual acknowledgment and training completion before cycle close and zero open willful-violation escalations without a recorded disposition.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for maintenance, interpretation, and the centralized governance of all controls in this policy.
- **Approver:** Patrick Wilson, Chief Compliance Officer.
- **Required participants:** Board of Directors (approval of insider credit, conflict determinations, corporate-opportunity dispositions, and sanctions), Legal/General Counsel (independent review and legal determinations), and the Supervisory Committee (oversight and review).
- **Review cadence:** At least annually (next review {{2027-06-16}}); the Board reviews and re-adopts the policy and conforms it to current law.
- **Cross-references:** Lending Policy (insider-lending operational process), Compliance Policy (general governance, whistleblower, complaint intake), Record Retention Policy (retention schedules), Reimbursement, Insurance and Indemnification Policy (indemnification/insurance), Resolution Policy (board resolutions and bylaws), Third-Party Risk Policy (enterprise affiliate/vendor risk beyond Reg W).
- **Internal cross-refs:** [Timing Matrix](#timing-matrix) · [FD-01](#fd-01-the-fiduciary-duties) · [FD-02](#fd-02-conflict-identification-and-general-duties) · [FD-03](#fd-03-annual-and-continuing-disclosure) · [FD-04](#fd-04-management-of-conflicts) · [FD-05](#fd-05-insider-transactions-reg-o) · [FD-06](#fd-06-transactions-with-affiliates-reg-w) · [FD-07](#fd-07-bank-bribery-gifts-and-kickbacks) · [FD-08](#fd-08-corporate-opportunity-and-tie-ins) · [FD-09](#fd-09-recordkeeping-and-reporting) · [FD-10](#fd-10-training-acknowledgment-and-enforcement)

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** Most fiduciary-duty resources, fields, and events referenced in the EVENTS tables (e.g., `coi.*`, `insider.*`, `affiliate.*`, `gift.*`, `corp_opportunity.*`, `tiein.*`, `covered_person.*`) are registered in the parsed core vocabulary; a few are coined under the Composition grammar where no exact registered code fit — notably `coi.conflict_identified` (composed from the registered `coi` subject + `identified` verb) and `corp_opportunity.identified` (registered `corp_opportunity` subject + `identified` verb). These and any other composed codes will be confirmed by engineering before the next review.
- **Charter and regulatory applicability.** The reference policy is a federal-thrift (OTS-era) document citing 12 CFR Parts 215, 223, 563 and HOLA. Pynthia is a credit union; the OTS/§563 citations are retained as the closest standing analogue for conflicts (§563.200) and corporate opportunity (§563.201), and Reg O (Part 215) and Reg W (Part 223) are applied as the governing insider/affiliate regimes. Confirm which insider-credit and affiliate-transaction rules apply to this credit union's charter (federal vs. state, and any NCUA-specific analogue) and whether the §563 provisions should be replaced with the equivalent NCUA citation.
- **State-chartered / DFPI applicability.** California Corporations Code §§309–310 and California Financial Code duties are cited on the assumption Pynthia is a California state-chartered institution examined by DFPI. Confirm charter and state to validate or remove the California citations.
- **Reg O thresholds and unimpaired-capital basis.** The prior-Board-approval thresholds (greater of $25,000 or 5% of unimpaired capital and surplus, or $500,000) and single-borrower limits (15% + 10% readily-marketable collateral) are taken verbatim from the reference policy. Confirm the current `cu.unimpaired_capital_surplus` source of record and that thresholds match the credit union's applicable lending-limit regime.
- **Exhibit content not specified.** Exhibits A (annual questionnaire), B (ad-hoc disclosure), and C (gift/entertainment thresholds) are referenced by PATRICK_NOTES but their detailed field sets and de minimis dollar limits are not provided; the de minimis thresholds (`gift.threshold_comparison`) must be defined and confirmed before deployment.
- **Affiliate definition scope.** The detailed Reg W definitions (affiliate, covered transaction, eligible affiliate activities, low-quality asset) from the reference policy are not reproduced here; the operational controls assume engineering will bind the affiliate population and covered-transaction taxonomy to the registered `affiliate` entity. Confirm the affiliate-determination source feeding `affiliate.list`.
- **"Promptly" reporting SLA.** FD-05 reports funded insider extensions "promptly to the Board"; this is operationalized as next-Board-meeting via `insider.report_due`. Confirm whether a fixed calendar deadline is required.
