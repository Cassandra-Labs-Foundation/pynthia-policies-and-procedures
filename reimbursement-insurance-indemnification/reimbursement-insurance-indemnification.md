---
title: Reimbursement, Insurance, and Indemnification of Officials Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Reimbursement, Insurance, Indemnification, Officials, D&O]
---

# Reimbursement, Insurance, and Indemnification of Officials Policy

## General Policy Statement

Pynthia Credit Union reimburses directors, officers, committee members, and volunteer officials for reasonable and customary business expenses incurred in service to the institution; maintains an insurance program — including Directors & Officers liability, Errors & Omissions, fidelity bond, cyber liability, and Employment Practices Liability — that protects officials and the institution; and indemnifies officials for liabilities arising from their service to the fullest extent permitted by Pynthia's articles and bylaws, [California Corporations Code §317](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CORP&sectionNum=317.), and federal law, and no further. Risk concentrates where an official's personal liability meets institutional funds — paying expenses that should not be reimbursed, indemnifying conduct the law forbids indemnifying, or carrying coverage gaps that leave officials and the institution exposed. This policy sets the standards, decision rights, and conflict-of-interest recusal requirements that make every reimbursement, coverage, and indemnification decision defensible and compliant. It applies to all directors, officers, committee members, and volunteer officials of Pynthia Credit Union.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Expense report submitted | Official submits report with receipts (`official.expense_report.submitted`) | Approved or returned within 15 business days | Reimbursable categories, receipt and threshold standards | [RI-01](#ri-01-business-expense-reimbursement) |
| Pre-approval for above-threshold expense | Official requests pre-approval before incurring (`official.expense_preapproval.requested`) | Decision within 5 business days | Threshold table maintained by CCO | [RI-01](#ri-01-business-expense-reimbursement) |
| Annual insurance program review | Policy renewal cycle opens (`insurance.review.opened`) | Completed and Board-reported at least 30 days before earliest renewal | Coverage schedule (D&O Side A/B/C, E&O, fidelity bond, cyber, EPL) | [RI-02](#ri-02-insurance-program-maintenance) |
| Claim or potential claim arises | Official or staff learns of claim (`indemnification.claim.notified`) | Carrier notice within policy notice period (internal: 5 business days from awareness) | Claims procedures, document preservation | [RI-08](#ri-08-claims-procedures) |
| Mandatory indemnification — success on the merits | Final disposition wholly favorable to official (`indemnification.matter.resolved_favorably`) | Indemnify expenses promptly upon presentation (internal: 30 days) | Cal. Corp. Code §317(d) mandatory standard | [RI-03](#ri-03-mandatory-indemnification) |
| Permissive indemnification request | Official requests indemnification for settlement/judgment (`indemnification.request.received`) | Standard-of-conduct determination within 60 days of complete request | §317(b)–(c) and (e) determination process | [RI-04](#ri-04-permissive-indemnification) |
| Advancement of defense costs | Official requests advancement with written undertaking (`indemnification.advance.requested`) | Decision within 20 business days of receipt of undertaking | §317(f) undertaking requirement | [RI-05](#ri-05-advancement-of-expenses) |
| Federal-bar screen on any indemnification or advance | Before any indemnification or advance payment (`indemnification.federal_screen.completed`) | Completed before any funds move | 12 CFR Part 359 / 12 USC §1828(k) screen | [RI-06](#ri-06-indemnification-exclusions) |
| Indemnification decision recorded | Decision body concludes (`indemnification.decision.recorded`) | Minuted at the meeting where decided; record retained permanently | Decision process and recusal record | [RI-07](#ri-07-decision-process-and-conflicts), [RI-09](#ri-09-recordkeeping) |

## RI-01 — Business Expense Reimbursement

- **WHY (Reg cite):** Reasonable reimbursement of officials' expenses is a permitted use of credit-union funds; payments beyond reasonable and customary business expenses risk treatment as prohibited compensation or improper personal benefit under the fiduciary framework anchoring [Cal. Corp. Code §317](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CORP&sectionNum=317.) and the federal safety-and-soundness restrictions in [12 USC §1828(k)](https://www.law.cornell.edu/uscode/text/12/1828). The control keeps institutional funds tied to documented institutional purposes.
- **SYSTEM BEHAVIOR:** Officials may be reimbursed only for defined categories — travel, lodging, meals, education/training, and board materials — at a reasonable-and-customary standard. Every claim requires original receipts (or itemized digital equivalents) and a stated business purpose; expenses above the CCO-maintained thresholds require written pre-approval before they are incurred. Personal expenses, unsupported claims, and expenses outside the defined categories are excluded and returned to the submitter with the reason recorded. A late-filed report (more than 90 days after the expense) requires CCO exception approval, recorded with the claim. The reimbursable-category list and threshold table are write-restricted to the Chief Compliance Officer.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Official requests pre-approval for an above-threshold expense (`official.expense_preapproval.requested`) | Official identity (`official.id`), category (`expense.category`), estimated amount (`expense.estimated_amount`), business purpose (`expense.purpose`) | Pre-approval grant or denial with reason (`official.expense_preapproval.decided`) | 5 business days (internal SLA; enforced by `expense.preapproval_due_at`) |
  | Official submits an expense report (`official.expense_report.submitted`) | Receipts (`expense.receipts[]`), category (`expense.category`), amount (`expense.amount`), business purpose (`expense.purpose`), pre-approval reference if applicable (`expense.preapproval_id`) | Approval and payment instruction, or return with exclusion reason (`official.expense_report.decided`) | 15 business days (internal SLA; enforced by `expense.review_due_at`) |
  | Approved reimbursement is paid (`official.reimbursement.paid`) | Approved report (`expense.report_id`), payee account details (`official.payment_account`) | Disbursement record linked to approval (`official.reimbursement.disbursed`) | 10 business days after approval (internal) |

- **ALERTS/METRICS:** Aging alert on expense reports unresolved past 15 business days; monthly count of excluded/returned claims by reason; target zero reimbursements paid without a linked approval record; quarterly trend of above-threshold pre-approvals per official.

## RI-02 — Insurance Program Maintenance

- **WHY (Reg cite):** A state-chartered credit union must maintain minimum fidelity-bond coverage under the [DFPI requirements applicable to California state-chartered credit unions](https://dfpi.ca.gov/regulated-industries/credit-unions/) (paralleling [NCUA 12 CFR Part 713](https://www.ecfr.gov/current/title-12/chapter-VII/subchapter-A/part-713)), and prudent coverage of officials supports the indemnification authority in [Cal. Corp. Code §317(i)](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CORP&sectionNum=317.), which expressly permits the purchase of insurance for agents against liabilities whether or not the institution could indemnify them directly.
- **SYSTEM BEHAVIOR:** The CCO, with the insurance broker/risk function, maintains a coverage schedule identifying each policy carried for officials and the institution: Directors & Officers liability with the Side A (non-indemnifiable individual losses), Side B (corporate reimbursement), and Side C (entity coverage) breakdown; Errors & Omissions; the required fidelity bond; cyber liability; and Employment Practices Liability. For each policy the schedule records carrier, limits, deductibles/retentions, claims-made vs. occurrence basis, covered persons, policy period, and notice provisions. The schedule is reviewed at least annually against the institution's risk profile and DFPI fidelity-bond minimums, with results and any coverage-gap recommendations reported to the Board before the earliest renewal date. Lapse in the fidelity bond is treated as a reportable compliance event requiring immediate Board notice. The coverage schedule is write-restricted to the Chief Compliance Officer and the risk function.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual review cycle opens, at least 90 days before earliest renewal (`insurance.review.opened`) | Current coverage schedule (`insurance.coverage_schedule`), carrier renewal terms (`insurance.renewal_terms[]`), risk-profile inputs (`institution.risk_profile`) | Completed review memo with gap analysis and Board report (`insurance.review.completed`) | Board-reported at least 30 days before earliest renewal (internal; enforced by `insurance.review_due_at`) |
  | Policy bound or renewed (`insurance.policy.bound`) | Binder/policy documents (`insurance.policy_documents[]`), limits and retentions (`insurance.policy_terms`) | Updated coverage schedule entry (`insurance.coverage_schedule.updated`) | 10 business days after binding (internal) |
  | Fidelity bond falls below DFPI minimum or lapses (`insurance.fidelity_bond.deficient`) | Bond terms (`insurance.fidelity_bond_terms`), DFPI minimum calculation (`insurance.dfpi_minimum`) | Immediate Board notice and remediation plan (`insurance.deficiency.reported`) | Board notified within 2 business days (internal) |

- **ALERTS/METRICS:** Renewal-countdown alerts at 90/60/30 days before each policy expiration; target zero days of fidelity-bond coverage below the DFPI minimum; annual review completed on time as a tracked Board-calendar item.

## RI-03 — Mandatory Indemnification

- **WHY (Reg cite):** [Cal. Corp. Code §317(d)](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CORP&sectionNum=317.) requires indemnification of an agent who has been successful on the merits in defense of a proceeding, and the bylaw authorization contemplated by [Cal. Corp. Code §204(a)(10)](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CORP&sectionNum=204.) operationalizes that commitment in Pynthia's governing documents.
- **SYSTEM BEHAVIOR:** When a director, officer, committee member, or volunteer official is successful on the merits in defending a claim, action, or proceeding arising from their service, Pynthia indemnifies the official for expenses actually and reasonably incurred — no discretionary determination is required. The official presents the final disposition and an itemized expense statement; Legal confirms the disposition is wholly favorable on the merits (partial or procedural dispositions route to [RI-04](#ri-04-permissive-indemnification) instead) and the federal-bar screen in [RI-06](#ri-06-indemnification-exclusions) is completed before payment. Payment authorization for mandatory indemnification is write-restricted to the CCO with Legal concurrence.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Final disposition wholly favorable to the official (`indemnification.matter.resolved_favorably`) | Disposition documents (`indemnification.disposition_record`), itemized expense statement (`indemnification.expense_statement`), Legal confirmation of success on the merits (`indemnification.legal_review`) | Mandatory-indemnification payment authorization (`indemnification.mandatory.authorized`) | Promptly upon presentation (internal: 30 days; enforced by `indemnification.payment_due_at`) |
  | Federal-bar screen completed for this payment (`indemnification.federal_screen.completed`) | Screen result (`indemnification.federal_screen_result`) | Cleared payment instruction linked to the matter file (`indemnification.payment.disbursed`) | Before any funds move |

- **ALERTS/METRICS:** Aging alert on favorable dispositions unpaid past 30 days; target zero mandatory-indemnification payments made without a completed federal-bar screen on file.

## RI-04 — Permissive Indemnification

- **WHY (Reg cite):** [Cal. Corp. Code §317(b)–(c)](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CORP&sectionNum=317.) permits indemnification for settlements and adverse judgments only where the official acted in good faith and in a manner the official reasonably believed to be in the best interests of the institution (and, in criminal matters, had no reasonable cause to believe the conduct was unlawful), with derivative-action limits in §317(c).
- **SYSTEM BEHAVIOR:** Indemnification for amounts paid in settlement, or for judgments and fines, is permitted only after a determination that the official met the applicable standard of conduct: good faith and a reasonable belief the action was in the institution's best interests, plus the criminal-matter standard where applicable. Settlements in derivative actions and amounts as to which the official is adjudged liable to the institution follow the narrower §317(c) limits, including court approval where the statute requires it. The determination is made through the [RI-07](#ri-07-decision-process-and-conflicts) process and is preceded by the [RI-06](#ri-06-indemnification-exclusions) screens. No payment, commitment, or public statement of indemnification is made before the determination is recorded. Recording of standard-of-conduct determinations is write-restricted to the CCO.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Official submits a complete indemnification request (`indemnification.request.received`) | Request and matter description (`indemnification.request`), settlement/judgment terms (`indemnification.liability_terms`), conduct evidence (`indemnification.conduct_record`) | Acknowledged request routed to the decision body (`indemnification.request.routed`) | 10 business days to route (internal) |
  | Decision body determines standard of conduct (`indemnification.standard_determination.made`) | Disinterested-decision-maker roster (`indemnification.decision_body`), Legal/independent-counsel analysis (`indemnification.counsel_opinion`), exclusion-screen results (`indemnification.federal_screen_result`) | Written determination granting or denying, with rationale (`indemnification.decision.recorded`) | 60 days from complete request (internal; enforced by `indemnification.determination_due_at`) |

- **ALERTS/METRICS:** Aging alert on requests pending past 45 days; target zero permissive-indemnification payments lacking a recorded standard-of-conduct determination; annual count of grants vs. denials reported to the Board.

## RI-05 — Advancement of Expenses

- **WHY (Reg cite):** [Cal. Corp. Code §317(f)](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CORP&sectionNum=317.) permits advancement of defense expenses before final disposition upon receipt of an undertaking to repay if it is ultimately determined the official is not entitled to indemnification; [12 CFR Part 359](https://www.ecfr.gov/current/title-12/part-359) conditions any advance on compliance with the federal prohibited-payment rules.
- **SYSTEM BEHAVIOR:** Pynthia may advance reasonable defense costs to an official before final resolution of a matter, but only after receiving the official's written undertaking to repay all advanced amounts if indemnification is ultimately not permitted, and only after the [RI-06](#ri-06-indemnification-exclusions) federal-bar screen clears. Advances are paid against itemized defense invoices, tracked as a receivable contingent on the final indemnification determination, and stop immediately if facts emerge indicating an exclusion applies. If indemnification is ultimately denied, repayment is pursued under the undertaking. Advance approvals are write-restricted to the CCO with Legal concurrence.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Official requests advancement with signed undertaking (`indemnification.advance.requested`) | Written undertaking to repay (`indemnification.undertaking`), matter description (`indemnification.request`), defense cost estimates (`indemnification.defense_budget`) | Advance approval or denial with rationale (`indemnification.advance.decided`) | 20 business days from receipt of undertaking (internal; enforced by `indemnification.advance_due_at`) |
  | Defense invoice presented under an approved advance (`indemnification.advance.invoice_received`) | Itemized invoice (`indemnification.defense_invoice`), cleared federal screen (`indemnification.federal_screen_result`) | Advance disbursement recorded as contingent receivable (`indemnification.advance.disbursed`) | 15 business days (internal) |
  | Final determination denies indemnification (`indemnification.decision.recorded`) | Undertaking (`indemnification.undertaking`), total advanced (`indemnification.advance_balance`) | Repayment demand issued under the undertaking (`indemnification.repayment.demanded`) | 30 days after the denial (internal) |

- **ALERTS/METRICS:** Outstanding-advance balance reported to the Board quarterly; target zero advances disbursed without an undertaking on file; aging alert on repayment demands outstanding past 90 days.

## RI-06 — Indemnification Exclusions

- **WHY (Reg cite):** [Cal. Corp. Code §317](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CORP&sectionNum=317.) bars indemnification where the standard of conduct is not met (bad faith, knowing violations of law, breach of the duty of loyalty, improper personal benefit), and federal law independently prohibits certain payments to institution-affiliated parties under [12 USC §1828(k)](https://www.law.cornell.edu/uscode/text/12/1828) and [12 CFR Part 359](https://www.ecfr.gov/current/title-12/part-359).
- **SYSTEM BEHAVIOR:** No indemnification or advance is paid for: conduct in bad faith; knowing violations of law; breach of the duty of loyalty; transactions from which the official derived an improper personal benefit; or any payment barred by 12 CFR Part 359 or 12 USC §1828(k) — including prohibited indemnification payments connected to administrative or civil enforcement proceedings that result in assessment or removal, regardless of the institution's condition. Every indemnification or advance decision includes a documented federal-bar screen before funds move; the Part 359 screen applies even though Pynthia is not currently in troubled condition, because the prohibited-indemnification provisions apply independently of troubled status. Legal Counsel performs the screen; the screen result record is write-restricted to Legal and the CCO.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Any indemnification or advance reaches the payment-decision stage (`indemnification.request.routed` or `indemnification.advance.requested`) | Matter facts (`indemnification.request`), enforcement-proceeding status (`indemnification.enforcement_status`), conduct findings to date (`indemnification.conduct_record`) | Documented federal-bar and exclusion screen result (`indemnification.federal_screen.completed`) | Before any funds move (internal: within 15 business days of routing) |
  | Screen identifies a bar or exclusion (`indemnification.federal_screen.flagged`) | Screen analysis (`indemnification.federal_screen_result`), Legal memo (`indemnification.counsel_opinion`) | Payment block and notice to the decision body and official (`indemnification.payment.blocked`) | 5 business days from the flag (internal) |

- **ALERTS/METRICS:** Target zero indemnification or advance disbursements without a logged screen result; immediate escalation alert to the CCO and Board chair on any flagged screen; annual attestation that no Part 359 / §1828(k)-barred payments were made.

## RI-07 — Decision Process and Conflicts

- **WHY (Reg cite):** [Cal. Corp. Code §317(e)](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CORP&sectionNum=317.) prescribes who may authorize indemnification — a majority vote of a quorum of disinterested directors, independent legal counsel in a written opinion, the members (with interested officials not voting), or the court — making disinterested decision-making a statutory condition of a valid indemnification determination.
- **SYSTEM BEHAVIOR:** Each indemnification determination is made by one of the statutorily authorized bodies, selected in this order of preference: (1) a majority vote of a quorum of directors who are not parties to the proceeding; (2) if such a quorum is not obtainable, a written opinion of independent legal counsel; (3) approval of the members, with the votes of interested officials excluded; or (4) the court in which the proceeding is pending. Any official with an interest in the matter must recuse from all deliberation and voting, consistent with the recusal framework in the Director Fiduciary Duties Policy; the recusal is recorded in the minutes alongside the determination. The decision record — body used, vote or opinion, and recusals — is write-restricted to the CCO.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Indemnification request routed for determination (`indemnification.request.routed`) | Interested-party identification (`indemnification.interested_officials[]`), available disinterested-director count (`indemnification.decision_body`) | Selected decision body and recusal list (`indemnification.decision_body.selected`) | 10 business days from routing (internal) |
  | Decision body concludes (`indemnification.standard_determination.made`) | Vote tally or counsel opinion (`indemnification.counsel_opinion`), recusal confirmations (`indemnification.recusal_record`) | Minuted determination with recusals recorded (`indemnification.decision.recorded`) | Minuted at the meeting where decided |

- **ALERTS/METRICS:** Target zero determinations recorded without an accompanying recusal record; exception alert if a determination is made by a body other than one authorized by §317(e); annual review of determinations for recusal completeness.

## RI-08 — Claims Procedures

- **WHY (Reg cite):** Claims-made policies condition coverage on timely notice, and preserving coverage is integral to the insurance authority of [Cal. Corp. Code §317(i)](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CORP&sectionNum=317.); failure to notify carriers or preserve records can convert an insured loss into an uninsured institutional expense, implicating the safety-and-soundness concerns behind [12 USC §1828(k)](https://www.law.cornell.edu/uscode/text/12/1828).
- **SYSTEM BEHAVIOR:** When any official or staff member learns of a claim or facts reasonably likely to give rise to a claim against an official or the institution, they notify the CCO immediately. The CCO, with the broker, provides notice to all potentially responsive carriers within each policy's notice period (internal standard: 5 business days from institutional awareness), issues a document-preservation (litigation hold) instruction covering all related records, and designates a single point of contact — communications about the matter outside the designated channel (with carriers, claimants, regulators, or media) are prohibited. The institution and the affected official cooperate fully with carriers as the policies require. Carrier-notice records and hold instructions are write-restricted to the CCO and Legal.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Claim or potential claim becomes known (`indemnification.claim.notified`) | Claim facts (`claim.description`), implicated officials (`claim.officials[]`), potentially responsive policies (`insurance.coverage_schedule`) | Carrier notice(s) issued and acknowledged (`insurance.carrier_notice.sent`) | Policy notice period (internal: 5 business days; enforced by `claim.carrier_notice_due_at`) |
  | Carrier notice issued (`insurance.carrier_notice.sent`) | Affected record custodians (`claim.record_custodians[]`), record scope (`claim.record_scope`) | Document-preservation hold issued (`claim.litigation_hold.issued`) | Same day as carrier notice (internal) |
  | Matter resolves or carrier closes the file (`claim.matter.closed`) | Resolution documents (`claim.resolution_record`) | Hold release and closure memo (`claim.litigation_hold.released`) | 30 days after closure (internal) |

- **ALERTS/METRICS:** Target zero late carrier notices (notice after the policy notice period); alert on any claim aged 5 business days from awareness without a sent carrier notice; count of active litigation holds reviewed quarterly.

## RI-09 — Recordkeeping

- **WHY (Reg cite):** Reliable records of reimbursement approvals, insurance policies, and indemnification determinations are what make the §317 determinations and the [12 CFR Part 359](https://www.ecfr.gov/current/title-12/part-359) screens demonstrable to examiners and courts; [Cal. Corp. Code §317(e)](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CORP&sectionNum=317.) determinations are only as defensible as the record showing who decided and on what basis.
- **SYSTEM BEHAVIOR:** Pynthia retains: every expense pre-approval, expense report, exclusion decision, and disbursement record from [RI-01](#ri-01-business-expense-reimbursement); the coverage schedule, policy documents, review memos, and carrier notices from [RI-02](#ri-02-insurance-program-maintenance) and [RI-08](#ri-08-claims-procedures); and every indemnification request, undertaking, screen result, determination, and payment or repayment record from [RI-03](#ri-03-mandatory-indemnification) through [RI-07](#ri-07-decision-process-and-conflicts). Retention periods and destruction follow the Record Retention Policy; D&O and indemnification matters are typically retained permanently. Records in this scope are append-only — corrections are made by superseding entries, never deletion — and deletion rights are restricted to the records function acting under the Record Retention Policy schedule.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Any artifact in scope is finalized (`official.expense_report.decided`, `insurance.review.completed`, `indemnification.decision.recorded`, et al.) | Final artifact and matter linkage (`record.artifact`, `record.matter_id`) | Filed record with retention class assigned (`record.retained`) | 10 business days after finalization (internal) |
  | Annual records audit runs (`record.audit.opened`) | Retention-class inventory (`record.retention_inventory`) | Audit report of completeness and retention compliance (`record.audit.completed`) | Annually, reported to the CCO within 30 days of audit close |

- **ALERTS/METRICS:** Target zero indemnification decisions without a filed permanent record; annual audit exception count trending to zero; alert on any in-scope record deletion outside the Record Retention Policy schedule.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for the policy, the threshold and coverage schedules, and all indemnification decision records.
- **Approvers:** Patrick Wilson, Chief Compliance Officer. Board ratification is obtained at adoption and at each material revision, given the Board's role in indemnification determinations and insurance oversight.
- **Required participants:** The Board of Directors (insurance review reporting, indemnification determinations), the insurance broker/risk function (coverage placement and renewal), and Legal Counsel (success-on-the-merits confirmation, federal-bar screens, counsel opinions).
- **Review cadence:** Annual review, next due 2027-06-04, plus interim review on any change to California Corporations Code §317, 12 CFR Part 359, 12 USC §1828(k), DFPI fidelity-bond requirements, or Pynthia's articles and bylaws.
- **Cross-references:** Director Fiduciary Duties Policy (duty-of-care/loyalty standards and conflict-of-interest recusal rules); Third-Party Risk Policy (broker and vendor selection and oversight); Record Retention Policy (retention periods and destruction); Charitable Donation Accounts Policy (institutional charitable contributions). Compensation and employee expense policies for non-official staff are out of scope (no dedicated HR policy in this repository).

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The events, fields, and timers referenced throughout the EVENTS tables (e.g., `official.expense_report.submitted`, `indemnification.decision.recorded`, `insurance.review.opened`, `claim.carrier_notice_due_at`) are not registered in `vocabulary.json` — the parsed spec is banking-core only and defines no events at all. All codes used here are the target naming scheme and will be confirmed and registered by engineering before the next review.
- **Insurance program specifics are unconfirmed.** Specific carriers, coverage limits, deductibles, Side A/B/C allocations, and policy notice periods must be confirmed against Pynthia's actual insurance program before this policy is finalized; the Timing Matrix's claims-notice deadline defers to each policy's actual notice provision.
- **Bylaw language is unconfirmed.** This policy assumes Pynthia's articles and bylaws contain an indemnification authorization consistent with Cal. Corp. Code §§204(a)(10) and 317; the exact bylaw text must be reconciled with this policy at the next Board review.
- **Charter-law applicability assumed.** The policy applies California Corporations Code §317 as the operative indemnification statute for Pynthia as a California state-chartered credit union; whether the California Credit Union Law supplies any additional or substitute indemnification provisions should be confirmed by Legal.
- **DFPI fidelity-bond minimum formula not specified.** Patrick's notes require maintaining the DFPI minimum but do not state the current required amount; the broker/risk function calculates it at each annual review and the figure lives in the coverage schedule, not this policy.
- **Internal SLAs are management defaults.** The internal deadlines in the Timing Matrix and EVENTS tables (5/10/15/20/30-day windows) are reasonable management defaults set where Patrick's notes were silent; the CCO may adjust them without a policy amendment so long as no statutory or policy-contract deadline is loosened.
- **Federal insurer framework noted.** 12 USC §1828(k) and 12 CFR Part 359 are FDIC provisions applicable to institution-affiliated parties; their application to Pynthia is adopted here as a compliance floor per Patrick's notes, and Legal should confirm the parallel NCUA/share-insurance provisions that apply to a credit union at the next review.
