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

## General Policy Statement

Pynthia Credit Union requires every director, executive officer, principal shareholder, and any employee or contractor with the power to direct its management or policy to discharge the full set of fiduciary duties owed to the credit union — loyalty, care, good faith, confidentiality, and a continuing duty to disclose. The core risk this policy controls is self-dealing and undisclosed conflicts that advance personal interests at the credit union's expense, together with the regulatory limits on insider credit (Reg O), transactions with affiliates (Reg W), bank bribery, and prohibited tie-ins. Conflict-of-interest disclosure is the operational implementation of the duty of loyalty. Loan underwriting mechanics, indemnification, board governance mechanics, record-retention schedules, and enterprise vendor risk are governed by their own policies and are out of scope here.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Annual disclosure questionnaire (Exhibit A) due from each director/officer | Annual cycle opens (`coi.annual_cycle_opened`) | Within annual cycle window | Signed questionnaire covering interests and related parties | [FD-03](#fd-03-annual-continuing-disclosure) |
| Mid-year conflict arises | Covered person identifies a conflict (`coi.conflict_identified`) | Promptly upon arising (internal: 5 BD) | Ad-hoc disclosure (Exhibit B) | [FD-03](#fd-03-annual-continuing-disclosure) |
| Conflicted matter before the Board | Agenda item flagged conflicted (`board.agenda_item_flagged_conflicted`) | Before discussion/vote | Recusal and Board determination recorded | [FD-04](#fd-04-management-of-conflicts) |
| Insider credit exceeds approval threshold | Insider credit application received (`insider.credit_application_received`) | Prior Board approval before funding | Board approval excluding interested director | [FD-05](#fd-05-insider-transactions-reg-o) |
| Insider extension funded | Credit funded (`insider.credit_extended`) | Promptly to Board (internal: next regular Board meeting) | Board report of extension | [FD-05](#fd-05-insider-transactions-reg-o) |
| Annual insider/related-interest record review | Insider survey issued (`insider.survey_issued`) | Annually | Reviewed insider/related-interest record | [FD-05](#fd-05-insider-transactions-reg-o) |
| Covered transaction with affiliate proposed | Covered transaction proposed (`affiliate.covered_transaction_proposed`) | Before execution | Limits/collateral/market-terms check | [FD-06](#fd-06-transactions-with-affiliates-reg-w) |
| Affiliate list annual update | List review opens (`affiliate.list_review_opened`) | At least annually | Updated affiliate list | [FD-06](#fd-06-transactions-with-affiliates-reg-w) |
| Gift/entertainment offered beyond authorized threshold | Disclosure submitted (`gift.disclosure_submitted`) | Promptly upon offer | Gift record entry | [FD-07](#fd-07-bank-bribery-gifts-kickbacks) |
| Gift records reported to Board | Board report compiled (`gift.board_report_issued`) | Periodically (internal: quarterly) | Board gift report | [FD-07](#fd-07-bank-bribery-gifts-kickbacks) |
| Corporate opportunity identified | Opportunity identified (`corp_opportunity.identified`) | Before any covered person acts on it | Board rejection recorded as sound business judgment | [FD-08](#fd-08-corporate-opportunity-tie-ins) |
| Public request for insider credit disclosure | Written request received (`insider.public_disclosure_requested`) | Per regulation; retain request 2 years | Public disclosure response | [FD-09](#fd-09-recordkeeping-public-disclosure) |
| Annual acknowledgment & training | Training cycle opens (`policy.training_cycle_opened`) | Annually | Signed acknowledgment + training completion | [FD-10](#fd-10-training-acknowledgment-enforcement) |
| Willful violation identified | Violation escalated (`policy.violation_escalated`) | Promptly to Board | Sanction record | [FD-10](#fd-10-training-acknowledgment-enforcement) |

## FD-01 — The Fiduciary Duties

- **WHY (Reg cite):** Establishes the umbrella duties of loyalty, care, good faith, confidentiality, and disclosure owed to the credit union, grounded in the conflicts-of-interest standard at [12 CFR §563.200](https://www.ecfr.gov/current/title-12/section-563.200) and the director duty-of-care / interested-director standards at [Cal. Corp. Code §309](https://www.law.cornell.edu/regulations) and [§310](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=310.&lawCode=CORP); California Financial Code duties apply to a DFPI-examined state charter.
- **SYSTEM BEHAVIOR:** The system maintains a roster of covered persons (directors, executive officers, principal shareholders, and any employee/contractor with decision authority) and binds each to the current policy version and its acknowledgment requirement. Designation of a covered person establishes the effective date from which the duties attach; a person who leaves a covered role retains the continuing duty for matters arising during tenure. The covered-person roster and effective-date fields are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | A new director/officer/decision-maker is designated (`covered_person.roster_updated`) | Covered-person identity (`covered_person.id`), role (`covered_person.role`), effective date (`covered_person.effective_date`), bound policy version (`policy.document_version`) | Updated covered-person roster + designation log (`governance.designation_recorded`) | At designation (internal: 5 BD) |

- **ALERTS/METRICS:** Alert on any decision-making role active without a current acknowledgment on file; target zero covered persons unbound to the current policy version.

## FD-02 — Conflict Identification & General Duties

- **WHY (Reg cite):** Implements the duty of loyalty: covered persons must not advance personal or related-party interests at the credit union's expense, must disclose all material information on any matter in which they have an interest, and must not participate in the Board's discussion or vote on that matter, per [12 CFR §563.200](https://www.ecfr.gov/current/title-12/section-563.200) and the interested-director standard at [Cal. Corp. Code §310](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=310.&lawCode=CORP).
- **SYSTEM BEHAVIOR:** When a covered person identifies an interest in a matter, the system captures the conflict and the related party, registers it in the conflict register, and links it to the affected matter so downstream Board workflow can enforce recusal. Covered persons must avoid even the appearance of a conflict; a disclosed financial interest is not automatically a conflict but must be recorded and routed for determination. The conflict register entry and related-party fields are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | A covered person identifies an interest in a matter (`coi.conflict_identified`) | Covered-person identity (`covered_person.id`), interest description (`coi.interest_description`), related party (`coi.related_party`), matter reference (`coi.matter_reference`) | Conflict register entry (`coi.register_entry_created`) | Promptly upon arising (internal: 5 BD) |

- **ALERTS/METRICS:** Alert on any conflict register entry lacking a downstream determination; track count of self-identified vs. examiner-identified conflicts as a leading indicator.

## FD-03 — Annual & Continuing Disclosure

- **WHY (Reg cite):** Requires the annual disclosure questionnaire (Exhibit A), the ad-hoc continuing-disclosure form (Exhibit B), and an annual insider/related-interest record reviewed for completeness, per the conflicts standard at [12 CFR §563.200](https://www.ecfr.gov/current/title-12/section-563.200) and the Reg O insider/related-interest identification requirement at [12 CFR §215.8](https://www.ecfr.gov/current/title-12/section-215.8).
- **SYSTEM BEHAVIOR:** Each annual cycle the system issues the questionnaire (Exhibit A) to every director and officer and tracks submission; mid-year, any covered person files the ad-hoc form (Exhibit B) when a conflict arises, satisfying the continuing-disclosure obligation. The annual cycle is governed by the registered `coi_questionnaire` review task, and a separate review task tracks completeness sign-off. Questionnaire responses and disclosure artifacts are write-restricted to Compliance; covered persons may submit but not edit filed responses.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual disclosure cycle opens (`coi.annual_cycle_opened`) | Questionnaire version (`coi.questionnaire_version`), covered-person roster (`covered_person.id`) | Issued questionnaires (`coi.questionnaire_issued`) | Annually (enforced by `coi.questionnaire_due_at`) |
  | A director/officer returns Exhibit A (`coi.questionnaire_submitted`) | Questionnaire responses (`coi.questionnaire_responses`), attestation signature (`coi.attestation_signature`), attestation date (`coi.attestation_date`) | Filed disclosure (`coi.disclosure_filed`) + completeness sign-off (`coi.certified`) | Within annual cycle (enforced by `coi.certification_due`) |
  | A conflict arises mid-year (`coi.conflict_identified`) | Ad-hoc form (`coi.adhoc_form`), interest description (`coi.interest_description`), related party (`coi.related_party`) | Ad-hoc disclosure filed (`coi.adhoc_disclosure_filed`) | Promptly upon arising (internal: 5 BD) |
  | Annual insider/related-interest record review (`insider.survey_issued`) | Prior record (`insider.record_prior`), reported related interests (`insider.record_entry`) | Updated insider record reviewed for completeness (`insider.record_updated`) | Annually (enforced by `insider_report.due`) |

- **ALERTS/METRICS:** Aging alert on unreturned questionnaires past the cycle deadline; target 100% completion before cycle close; alert on ad-hoc disclosures filed >5 BD after the underlying conflict date.

## FD-04 — Management of Conflicts

- **WHY (Reg cite):** Provides for recusal, abstention from voting, independent review, and a disinterested Board determination on conflicted matters, with interested parties barred from influencing deliberations, per [12 CFR §563.200](https://www.ecfr.gov/current/title-12/section-563.200) and the interested-director transaction standard at [Cal. Corp. Code §310](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=310.&lawCode=CORP).
- **SYSTEM BEHAVIOR:** When an agenda item is flagged as conflicted, the system requires the interested party's recusal, confirms a disinterested quorum, and records the Board's determination in the minutes; the interested party may present facts but must leave before discussion and vote. Any attempt by the interested party to vote on the flagged matter is blocked and logged. Recusal records and determination fields are write-restricted to Compliance and the Board Secretary.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | A conflicted matter reaches the Board (`board.agenda_item_flagged_conflicted`) | Matter reference (`coi.matter_reference`), interested party (`covered_person.id`), disinterested quorum (`board.disinterested_quorum`) | Recusal recorded (`coi.recusal_logged`) | Before discussion/vote |
  | Interested party recuses and Board acts (`coi.recusal_executed`) | Recusal record (`coi.recusal_record`), conflicted-matter vote status (`coi.conflicted_matter_voted`), determination (`coi.determination_made`), independent review (`coi.independent_review`) | Board determination logged in minutes (`coi.determination_logged`) + minutes (`board.minutes_recorded`) | At the meeting (internal: minutes within 10 BD) |

- **ALERTS/METRICS:** Target zero conflicted-matter votes cast by an interested party; alert on any Board determination on a conflicted matter lacking a recorded recusal.

## FD-05 — Insider Transactions (Reg O)

- **WHY (Reg cite):** Requires that extensions of credit to insiders be on substantially the same terms and underwriting as comparable non-insider transactions, with prior disinterested-Board approval above the threshold (greater of $25,000 or 5% of unimpaired capital and surplus, or $500,000), observance of the single-borrower limit (15%, plus 10% for readily marketable collateral) and aggregate insider limit, and prompt reporting to the Board, per [12 CFR §215.4](https://www.ecfr.gov/current/title-12/section-215.4), [§215.6](https://www.ecfr.gov/current/title-12/section-215.6), and [§215.8](https://www.ecfr.gov/current/title-12/section-215.8) (FRA §22(g),(h), [12 U.S.C. §375a](https://www.law.cornell.edu/uscode/text/12/375a), [§375b](https://www.law.cornell.edu/uscode/text/12/375b)).
- **SYSTEM BEHAVIOR:** When an insider credit application is received, the system screens terms for parity against comparable non-insider transactions, computes aggregate credit to the insider and related interests, and gates funding on prior Board approval (excluding the interested director) when the threshold is exceeded; single-borrower and aggregate insider limits are checked before funding. Underwriting and broader insider-lending operational process live in the Lending Policy and are out of scope here. After funding, the extension is reported to the Board at its next regular meeting, and Board line-of-credit approvals expire per the registered approval timer. Proposed/funded terms, aggregate-credit fields, and parity results are write-restricted to Compliance and Lending; the interested director cannot view or act on the approval record.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Insider credit application received (`insider.credit_application_received`) | Proposed terms (`insider.proposed_terms`), comparable terms (`insider.comparable_terms`), aggregate credit amount (`insider.aggregate_credit_amount`), collateral marketability (`insider.collateral_marketability`) | Terms-parity check (`insider.terms_parity_checked`) | Before approval/funding |
  | Aggregate credit exceeds threshold (`insider.credit_threshold_exceeded`) | Aggregate credit amount (`insider.aggregate_credit_amount`), officer financial statement (`insider.officer_financial_statement`), disinterested quorum (`board.disinterested_quorum`) | Board approval recorded excluding interested director (`insider.board_approval_recorded`) | Prior to funding (LOC approval enforced by `insider.loc_approval_expires_at`) |
  | Insider extension funded (`insider.credit_extended`) | Funded terms (`insider.funded_terms`), recomputed limits (`insider.limits_recomputed`) | Board report of extension (`insider.board_report_issued`) | Promptly (internal: next regular Board meeting; enforced by `insider_report.due`) |
  | Annual insider/related-interest record review (`insider.survey_issued`) | Prior record (`insider.record_prior`), compiled record (`insider.record_compiled`) | Insider limit report (`insider.limit_report_issued`) | Annually (enforced by `insider_report.due`) |

- **ALERTS/METRICS:** Alert on any insider extension funded above threshold without a recorded disinterested-Board approval; alert on single-borrower or aggregate insider limit breach; target zero non-parity insider terms.

## FD-06 — Transactions With Affiliates (Reg W)

- **WHY (Reg cite):** Limits covered transactions to 10% of unimpaired capital and surplus per affiliate and 20% in the aggregate, requires collateral and market terms, prohibits purchase of low-quality assets, and requires an affiliate list updated at least annually, per Reg W [12 CFR §223.13](https://www.ecfr.gov/current/title-12/section-223.13) (limits), [§223.14](https://www.ecfr.gov/current/title-12/section-223.14) (collateral), [§223.15](https://www.ecfr.gov/current/title-12/section-223.15) (low-quality assets), and [§223.51](https://www.ecfr.gov/current/title-12/section-223.51) (market terms) (FRA §§23A/23B, [12 U.S.C. §371c](https://www.law.cornell.edu/uscode/text/12/371c), [§371c-1](https://www.law.cornell.edu/uscode/text/12/371c-1)).
- **SYSTEM BEHAVIOR:** When a covered transaction with an affiliate is proposed, the system checks per-affiliate (10%) and aggregate (20%) limits against unimpaired capital and surplus, verifies the required collateral coverage ratio, screens for low-quality assets, and confirms market-terms basis before funding; transactions failing any gate are blocked. A standing affiliate list is reviewed and updated at least annually, and each transaction is recorded with the data needed to demonstrate limit, collateral, and market-terms compliance. Enterprise affiliate/vendor risk beyond Reg W transaction limits lives in the Third-Party Risk Policy. Affiliate-list entries, transaction records, and limit-utilization fields are write-restricted to Compliance and Finance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Covered transaction with an affiliate proposed (`affiliate.covered_transaction_proposed`) | Transaction type (`affiliate.transaction_type`), transaction amount (`affiliate.transaction_amount`), unimpaired capital and surplus (`cu.unimpaired_capital_surplus`), required coverage ratio (`affiliate.required_coverage_ratio`), collateral type (`affiliate.collateral_type`) | Limits checked (`affiliate.limits_checked`) | Before execution (enforced by `concentration.compute_due_at`) |
  | Low-quality-asset screen on a proposed purchase (`affiliate.asset_purchase_proposed`) | Asset quality classification (`affiliate.asset_quality_classification`), independent evaluation (`affiliate.independent_evaluation`), market-terms basis (`affiliate.market_terms_basis`) | Low-quality-asset screen logged (`affiliate.lqa_screen_logged`) | Before execution |
  | Affiliate credit transaction funded (`affiliate.credit_transaction_funded`) | Limit utilization (`affiliate.limit_utilization`), collateral value (`affiliate.collateral_value`), transaction file archived (`affiliate.transaction_file_archived`) | Transaction recorded (`affiliate.transaction_recorded`) | At funding |
  | Affiliate list annual review (`affiliate.list_review_opened`) | Affiliate list (`affiliate.list`), list entry (`affiliate.list_entry`) | Updated affiliate list (`affiliate.list_updated`) | At least annually |

- **ALERTS/METRICS:** Alert on any per-affiliate (>10%) or aggregate (>20%) limit breach; alert on collateral coverage below the required ratio; alert if the affiliate list age exceeds 12 months; target zero low-quality-asset purchases from affiliates.

## FD-07 — Bank Bribery, Gifts & Kickbacks

- **WHY (Reg cite):** Prohibits soliciting or receiving anything of value in connection with credit union business, permits only de minimis gifts/entertainment within defined thresholds (Exhibit C), and requires disclosure of offers beyond what is authorized with records reported to the Board, per the Federal Bank Bribery Law [18 U.S.C. §215](https://www.law.cornell.edu/uscode/text/18/215) and the Guidelines for Compliance With the Federal Bank Bribery Law, 52 Fed. Reg. 43941 (1987).
- **SYSTEM BEHAVIOR:** When a gift, gratuity, or entertainment is offered beyond the Exhibit C threshold, the covered person must disclose it; the system compares the estimated value against the threshold, records the disposition (accept/return/decline), and compiles the records into a periodic Board report. Items based on obvious family or personal relationships, reasonable business-meeting hospitality, and de minimis promotional items are not prohibited and need not be disclosed. The gift record and disposition fields are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Gift/entertainment offered beyond authorized threshold (`gift.disclosure_submitted`) | Source party (`gift.source_party`), estimated value (`gift.estimated_value`), threshold comparison (`gift.threshold_comparison`), disposition (`gift.disposition`) | Gift record entry (`gift.record_entry_created`) | Promptly upon offer (internal: 5 BD) |
  | Ruling requested on whether an item may be accepted (`gift.approval_requested`) | Source party (`gift.source_party`), estimated value (`gift.estimated_value`) | Ruling issued (`gift.ruling_issued`) | Before acceptance (internal: 3 BD) |
  | Periodic gift records reported to Board (`gift.board_report_compiled`) | Compiled gift records (`gift.record_entry_id`) | Board gift report (`gift.board_report_issued`) | Periodically (internal: quarterly) |

- **ALERTS/METRICS:** Alert on any accepted item above threshold without a disclosure record; target zero undisclosed above-threshold gifts; track disclosure volume trend per quarter.

## FD-08 — Corporate Opportunity & Tie-Ins

- **WHY (Reg cite):** Prohibits usurping corporate opportunities belonging to the credit union and prohibited tie-in arrangements, and requires documented Board rejection of opportunities as a matter of sound business judgment, per the corporate-opportunity standard at [12 CFR §563.201](https://www.ecfr.gov/current/title-12/section-563.201) and the anti-tying prohibitions at [12 U.S.C. §1464(q)](https://www.law.cornell.edu/uscode/text/12/1464) and RESPA [12 U.S.C. §2608](https://www.law.cornell.edu/uscode/text/12/2608).
- **SYSTEM BEHAVIOR:** When an opportunity within the credit union's corporate authority and of present or potential advantage is identified, it must be presented to a disinterested Board before any covered person pursues it; the system records the Board's disposition, and a documented rejection as sound business judgment clears the covered person. Separately, any conditioned tie-in arrangement is flagged for review and blocked if prohibited. Opportunity disposition records and tie-in review fields are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | A corporate opportunity is identified (`corp_opportunity.identified`) | Opportunity description (`corp_opportunity.description`), authority assessment (`corp_opportunity.authority_assessment`) | Opportunity presented to Board (`corp_opportunity.presented`) | Before any covered person acts |
  | Board decides on the opportunity (`corp_opportunity.board_voted`) | Disinterested quorum (`board.disinterested_quorum`), Board resolution (`board.resolution_id`) | Disposition logged as sound business judgment (`corp_opportunity.disposition_logged`) | At the meeting (minutes within 10 BD) |
  | A prohibited tie-in condition is detected (`tiein.flagged`) | Condition description (`tiein.condition_description`), transaction terms (`tiein.transaction_terms`) | Tie-in review logged (`tiein.review_logged`) | Before execution |

- **ALERTS/METRICS:** Target zero opportunities pursued by a covered person without a recorded Board disposition; alert on any flagged tie-in proceeding without a cleared review.

## FD-09 — Recordkeeping & Public Disclosure

- **WHY (Reg cite):** Requires retention of disclosures, insider/related-interest records, affiliate transaction records, and gift records, and public disclosure of insider credit on written request, per the Reg O public-disclosure requirement at [12 CFR §215.11](https://www.ecfr.gov/current/title-12/section-215.11) and the insider-record requirement at [12 CFR §215.8](https://www.ecfr.gov/current/title-12/section-215.8). Detailed retention schedules (typically permanent) are governed by the Record Retention Policy.
- **SYSTEM BEHAVIOR:** The system retains conflict disclosures, insider/related-interest records, affiliate transaction files, and gift records under a registered retention class; on receipt of a written public request for insider credit disclosure, it produces the required disclosure (names of executive officers/principal shareholders meeting the correspondent-credit threshold, without specific amounts) and retains the request and its disposition for two years. Public-request records and disclosure artifacts are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | A fiduciary record is created (`record.created`) | Record class (`record.retention_class`), retention timer (`record.retention_timer`), retention anchor (`retention_spec.anchor_date`) | Retention clock set (`record.retention_clock_set`) | At creation (enforced by `record.retention_expires_at`) |
  | Written public request for insider credit disclosure received (`insider.public_disclosure_requested`) | Requester (`disclosure_detail.requester`), request document (`disclosure_detail.request_doc`), correspondent credit data (`insider.correspondent_credit_data`) | Public disclosure issued (`insider.public_disclosure_issued`) | Per regulation; retain request 2 years (enforced by `insider.public_request_retention_expires_at`) |

- **ALERTS/METRICS:** Alert on any fiduciary record without an assigned retention class; alert on a public request approaching its 2-year retention horizon without a recorded disposition.

## FD-10 — Training, Acknowledgment & Enforcement

- **WHY (Reg cite):** Requires distribution of the policy to all directors and officers, an annual signed acknowledgment and annual training, and defined escalation, removal, and Board sanctions for willful violations (return of benefits, resignation, or dismissal), grounded in the conflicts and corporate-opportunity standards at [12 CFR §563.200](https://www.ecfr.gov/current/title-12/section-563.200) and [§563.201](https://www.ecfr.gov/current/title-12/section-563.201) and the insider-responsibility standard at [12 CFR §215.6](https://www.ecfr.gov/current/title-12/section-215.6).
- **SYSTEM BEHAVIOR:** Each annual cycle the system distributes the policy, assigns training, and tracks a signed acknowledgment from every director and officer; new directors/officers receive the policy on election or hire. On a willful violation, the matter is escalated to the Board, which may require return of benefits, resignation, or dismissal, and the sanction is recorded. Acknowledgment records, training-completion records, and sanction records are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual training & acknowledgment cycle opens (`policy.training_cycle_opened`) | Policy document version (`policy.document_version`), covered-person roster (`covered_person.id`), curriculum (`training.curriculum_id`) | Training assigned (`training.annual_assigned`) | Annually (enforced by `training.annual_due_at`) |
  | A director/officer signs the acknowledgment (`policy.acknowledgment_signed`) | Acknowledgment record (`policy.acknowledgment_record`), signer identity (`covered_person.id`) | Acknowledgment filed (`policy.compliance_record_filed`) | Annually (enforced by `policy.acknowledgment_due_at`) |
  | A new director/officer is onboarded (`employee.hired`) | Policy document version (`policy.document_version`), covered-person identity (`covered_person.id`) | Onboarding acknowledgment filed (`policy.onboarding_acknowledgment_filed`) | At election/hire (internal: 10 BD) |
  | A willful violation is identified (`policy.violation_escalated`) | Violation description (`policy.violation_description`), investigation file (`policy.investigation_file`) | Sanction recorded (`policy.sanction_recorded`) | Promptly to Board (internal: next regular Board meeting; enforced by `finding.escalation_due_at`) |

- **ALERTS/METRICS:** Aging alert on incomplete acknowledgments/training past the cycle deadline; target 100% completion; alert on any escalated willful violation without a recorded Board sanction.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer, who maintains this policy, the covered-person roster, and the conflict/insider/affiliate/gift registers.
- **Approver:** Patrick Wilson, Chief Compliance Officer.
- **Required participants:** Board of Directors (approval of conflicted matters, insider credit above threshold, corporate-opportunity dispositions, sanctions); Legal/General Counsel (interested-director and Reg W/Reg O determinations); Supervisory Committee (independent review and oversight).
- **Review cadence:** Reviewed and, if appropriate, revised at least annually by the Board to conform to current laws and regulations; next review {{next_review}}.
- **Cross-refs:** Lending Policy (insider-lending underwriting and operational process); Compliance Policy (general compliance governance, whistleblower, complaint intake); Record Retention Policy (retention schedules for disclosures and director records); Reimbursement, Insurance and Indemnification Policy (officer/director indemnification and insurance); Resolution Policy (board resolutions, bylaws, governance mechanics); Third-Party Risk Policy (enterprise affiliate/vendor risk beyond Reg W limits).

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** Several field, event, and timer codes referenced in the control overlays are not yet registered in `core-vocabulary.json` (parsed spec is banking-core only). Codes used verbatim from the **Provisional codes** registry include `covered_person.id`, `covered_person.role`, `corp_opportunity.description`, `policy.id`, and `policy.version`; codes composed under the grammar (registered subject + registered verb/task type) where no registered code fit include `governance.designation_recorded`, `affiliate.lqa_screen_logged`, `gift.board_report_compiled` (consuming trigger paired with the registered `gift.board_report_issued`), and `corp_opportunity.board_voted`. Engineering will confirm or register these before the next review.
- **Charter type and Reg O/Reg W applicability.** This policy applies FRA §22(g)/(h) and Reg O (12 CFR Part 215) and §§23A/23B and Reg W (12 CFR Part 223) to a credit union by analogy to the reference bank policy. Pynthia's NCUA charter and the precise applicability of Part 215/Part 223 versus NCUA insider-lending and CUSO rules (e.g., 12 CFR Part 701.21(d), Part 712) must be confirmed; thresholds and limits are stated as in the reference policy and may require restatement under the governing NCUA/DFPI standard.
- **Single-charter regulator.** The reference policy was drafted for an OTS-supervised thrift (§§563.200/563.201, 563.41, 563.43). Those clauses are cited here as the closest conflicts/corporate-opportunity/affiliate analogues; the operative citations for a DFPI-examined, NCUA-insured state credit union should be confirmed and substituted where a direct NCUA equivalent exists.
- **Quantitative thresholds.** The insider prior-approval threshold (greater of $25,000 or 5% of unimpaired capital and surplus, or $500,000), the single-borrower limit (15% + 10% for readily marketable collateral), the aggregate insider limit, and the Reg W 10%/20% limits are carried from the reference policy and the bank-Reg framework; confirm the credit-union-specific figures and the definition of unimpaired capital and surplus.
- **Gift thresholds (Exhibit C).** The de minimis gift/entertainment thresholds are referenced as "Exhibit C" but no numeric value was supplied in PATRICK_NOTES; the dollar limits must be confirmed and embedded in the Exhibit before adoption.
- **Board reporting cadence.** "Promptly" and "periodically" for insider-extension reporting and gift-record reporting are implemented as next-regular-Board-meeting and quarterly internal SLAs respectively; confirm the Board's preferred cadence.
- **Public-disclosure retention.** The 2-year retention for public insider-credit-disclosure requests follows the reference Reg O standard; confirm against the Record Retention Policy, which the notes indicate generally treats director records as permanent.
