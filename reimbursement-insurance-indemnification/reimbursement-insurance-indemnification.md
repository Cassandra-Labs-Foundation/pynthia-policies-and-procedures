---
title: Reimbursement, Insurance, and Indemnification of Officials Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0-draft
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Indemnification, Insurance, Reimbursement, Officials, D&O]
---

## General Policy Statement

Pynthia Credit Union commits to reimbursing only reasonable, documented, business-purpose expenses of its directors, officers, committee members, and volunteers; to maintaining an insurance program (D&O, E&O, fidelity bond, cyber, EPL) sufficient to protect both those officials and the institution; and to indemnifying officials only to the extent permitted by law. Risk concentrates where personal liability meets institutional funds, so this policy sets clear standards, decision rights, and conflict-of-interest recusal for every reimbursement, coverage, and indemnification decision, within the limits of the articles, bylaws, California Corporations Code §317, FDIC Part 359, and 12 USC §1828(k). Specific carriers, coverage limits, and bylaw language must be confirmed against Pynthia's actual program before this policy is finalized.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Expense above pre-approval threshold | Official requests pre-approval (`official.expense_preapproval.requested`) | Before expense incurred (internal: 5 BD) | Pre-approval decision | [RII-01](#rii-01-business-expense-reimbursement) |
| Annual insurance program review | Review cycle opens (`insurance.review.opened`) | At least annually | Coverage schedule | [RII-02](#rii-02-insurance-program-maintenance) |
| Official successful on the merits | Favorable resolution recorded (`indemnification.decision.recorded`) | Per bylaws / §317(d) (internal: 30 days) | Mandatory indemnification authorization | [RII-03](#rii-03-mandatory-indemnification) |
| Settlement / adverse judgment claim | Indemnification request received (`indemnification.request.received`) | Internal: 60 days to determination | Standard-of-conduct determination | [RII-04](#rii-04-permissive-indemnification) |
| Advancement of defense costs requested | Advance requested w/ undertaking (`indemnification.advance.invoice_received`) | Internal: 30 days | Advancement decision + undertaking | [RII-05](#rii-05-advancement-of-expenses) |
| Federal/state bar screening | Federal screen run (`indemnification.federal_screen.completed`) | Before any payment | Part 359 / §1828(k) screen result | [RII-06](#rii-06-indemnification-exclusions) |
| Indemnification decision body convened | Request routed to decision body (`coi.recusal_executed`) | Before determination | Disinterested decision + recusal record | [RII-07](#rii-07-decision-process-and-conflicts) |
| Claim or potential claim arises | Carrier notice due (`insurance.carrier_notice.sent`) | Per policy terms (internal: 5 BD) | Carrier notice + hold | [RII-08](#rii-08-claims-procedures) |
| Reimbursement/insurance/indemnification record created | Record created (`record.created`) | Permanent for D&O matters | Retention record | [RII-09](#rii-09-recordkeeping) |

## RII-01 — Business Expense Reimbursement  {#rii-01-business-expense-reimbursement}

- **WHY (Reg cite):** Reimbursement of official expenses must be reasonable and documented to avoid improper personal benefit that would later bar indemnification or breach fiduciary duty under [California Corporations Code §317](https://california.public.law/codes/ca_corp_code_section_317); unreasonable or undocumented payments to institution-affiliated parties also implicate the federal prohibitions in [12 USC §1828(k)](https://www.law.cornell.edu/uscode/text/12/1828) and [FDIC Part 359](https://www.ecfr.gov/current/title-12/part-359).

- **SYSTEM BEHAVIOR:** Officials submit expense reports against defined reimbursable categories (travel, lodging, meals, education/training, board materials), each tested against a reasonable-and-customary standard and supported by original receipts. Expenses whose estimated amount exceeds the defined threshold require pre-approval before they are incurred; expenses below threshold flow to post-incurrence review. Personal, unsupported, or excluded items are denied with a recorded basis. Approval authority for reimbursement decisions is write-restricted to the CCO or designated approver per the authority matrix; officials may not approve their own reimbursements.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Official requests pre-approval for an above-threshold expense (`official.expense_preapproval.requested`) | Official identity (`official.id`), category (`expense.category`), estimated amount (`expense.estimated_amount`), business purpose (`expense.purpose`) | Pre-approval decision recorded (`official.expense_preapproval.decided`) | Before expense incurred (internal: 5 BD; enforced by `expense.preapproval_due_at`) |
  | Official submits an expense report (`official.expense_report.submitted`) | Official identity (`official.id`), amount (`expense.amount`), category (`expense.category`), purpose (`expense.purpose`), pre-approval reference (`expense.preapproval_id`) | Reimbursement decision recorded (`official.expense_report.decided`) | Internal: 10 BD from submission; enforced by `expense.review_due_at` |
  | Reimbursement approved and paid (`official.expense_report.decided`) | Payment account (`official.payment_account`), report reference (`expense.report_id`) | Disbursement recorded (`official.reimbursement.paid`) | Internal: 10 BD of approval |

- **ALERTS/METRICS:** Alert on pre-approval requests aging past `expense.preapproval_due_at` and expense reports aging past `expense.review_due_at`; track count of denied/exception items and target zero self-approvals.

## RII-02 — Insurance Program Maintenance  {#rii-02-insurance-program-maintenance}

- **WHY (Reg cite):** State-chartered institutions must carry minimum fidelity-bond coverage under DFPI requirements, and adequate D&O/E&O/cyber/EPL coverage backstops the indemnification commitments authorized in the articles/bylaws under [California Corporations Code §204(a)(10)](https://california.public.law/codes/ca_corp_code_section_204) and [§317(i)](https://california.public.law/codes/ca_corp_code_section_317) (insurance in lieu of or in addition to indemnification).

- **SYSTEM BEHAVIOR:** The institution maintains and documents a coverage schedule covering D&O liability (with Side A/B/C breakdown), Errors & Omissions, the required fidelity bond, cyber liability, and Employment Practices Liability, capturing limits, deductibles, claims-made vs. occurrence basis, and who is covered. The program is reviewed at least annually; a fidelity bond falling below the DFPI minimum is flagged as deficient and remediated. The coverage schedule and policy terms are write-restricted to the CCO and the risk/broker function; broker selection and oversight live in the Third-Party Risk Policy and are out of scope here.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual insurance review cycle opens (`insurance.review.opened`) | Coverage schedule (`insurance.coverage_schedule`), policy terms (`insurance.policy_terms`), fidelity bond terms (`insurance.fidelity_bond_terms`), DFPI minimum (`insurance.dfpi_minimum`) | Review completed and schedule updated (`insurance.review.completed`, `insurance.coverage_schedule.updated`) | At least annually; enforced by `insurance.review_due_at` |
  | Fidelity bond found below DFPI minimum (`insurance.deficiency.reported`) | Fidelity bond terms (`insurance.fidelity_bond_terms`), DFPI minimum (`insurance.dfpi_minimum`), bond adjustment (`insurance.bond.adjustment`) | Deficiency report + remediation record (`insurance.deficiency.reported`) | Internal: remediate within 30 days; enforced by `insurance.review_due_at` |
  | New or renewed policy bound (`insurance.coverage_schedule.updated`) | Policy terms (`insurance.policy_terms`), policy bound flag (`insurance.policy.bound`) | Updated coverage schedule (`insurance.coverage_schedule.updated`) | At binding; no registered timer (annual review per `insurance.review_due_at`) |

- **ALERTS/METRICS:** Alert when `insurance.review_due_at` is within 30 days or lapsed, and on any open `insurance.deficiency.reported` for the fidelity bond; target zero coverage gaps against the documented schedule.

## RII-03 — Mandatory Indemnification  {#rii-03-mandatory-indemnification}

- **WHY (Reg cite):** A director or officer who is successful on the merits in defending a proceeding arising from their service must be indemnified against expenses actually and reasonably incurred, as required by [California Corporations Code §317(d)](https://california.public.law/codes/ca_corp_code_section_317).

- **SYSTEM BEHAVIOR:** When a matter resolves favorably for an official (success on the merits or otherwise), the system records the favorable disposition and authorizes mandatory indemnification of expenses actually and reasonably incurred, to the extent required by the bylaws and §317(d), without a discretionary standard-of-conduct vote. Any payment remains subject to the federal screen in [RII-06](#rii-06-indemnification-exclusions). Authorization of mandatory indemnification is write-restricted to the indemnification decision body designated under [RII-07](#rii-07-decision-process-and-conflicts).

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Matter resolved favorably for the official (`indemnification.decision.recorded`) | Matter resolution flag (`indemnification.matter.resolved_favorably`), expense statement (`indemnification.expense_statement`), conduct record (`indemnification.conduct_record`) | Mandatory indemnification authorized (`indemnification.mandatory.authorized`) | Per bylaws / §317(d) (internal: 30 days; enforced by `indemnification.determination_due_at`) |
  | Authorized indemnification ready for payment (`indemnification.mandatory.authorized`) | Federal screen result (`indemnification.federal_screen_result`), liability terms (`indemnification.liability_terms`) | Payment disbursed and recorded (`indemnification.payment.disbursed`) | Internal: 30 days of authorization; enforced by `indemnification.payment_due_at` |

- **ALERTS/METRICS:** Alert on favorable resolutions without an authorization recorded past `indemnification.determination_due_at`; track median days from favorable resolution to payment and target zero mandatory claims unpaid beyond SLA.

## RII-04 — Permissive Indemnification  {#rii-04-permissive-indemnification}

- **WHY (Reg cite):** Indemnification for settlements or adverse judgments is permitted only where the official acted in good faith and reasonably believed the action was in the institution's best interest, per the standards of [California Corporations Code §317(b)–(c)](https://california.public.law/codes/ca_corp_code_section_317).

- **SYSTEM BEHAVIOR:** On an indemnification request arising from a settlement or adverse judgment, the decision body evaluates whether the official met the applicable standard of conduct (good faith and reasonable belief in the institution's best interest), supported by a conduct record and, where used, an independent legal counsel opinion. A determination that the standard was not met blocks indemnification; a payment is also blocked if the federal screen in [RII-06](#rii-06-indemnification-exclusions) flags it. Standard-of-conduct determinations are write-restricted to the designated decision body under [RII-07](#rii-07-decision-process-and-conflicts).

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Indemnification request received for a settlement/adverse judgment (`indemnification.request.received`) | Official identity (`official.id`), conduct record (`indemnification.conduct_record`), counsel opinion (`indemnification.counsel_opinion`), liability terms (`indemnification.liability_terms`) | Standard-of-conduct determination made (`indemnification.standard_determination.made`) | Internal: 60 days; enforced by `indemnification.determination_due_at` |
  | Determination recorded (`indemnification.decision.recorded`) | Determination outcome (`indemnification.standard_determination.made`), federal screen result (`indemnification.federal_screen_result`), payment block flag (`indemnification.payment.blocked`) | Decision recorded; payment disbursed or blocked (`indemnification.payment.disbursed` / `indemnification.payment.blocked`) | Internal: 30 days of determination; enforced by `indemnification.payment_due_at` |

- **ALERTS/METRICS:** Alert on permissive requests aging past `indemnification.determination_due_at`; track approve/deny/block ratios and confirm every adverse-judgment payment has a recorded standard-of-conduct determination.

## RII-05 — Advancement of Expenses  {#rii-05-advancement-of-expenses}

- **WHY (Reg cite):** Defense expenses may be advanced before final disposition upon receipt of an undertaking to repay if it is ultimately determined the official is not entitled to indemnification, as authorized by [California Corporations Code §317(f)](https://california.public.law/codes/ca_corp_code_section_317).

- **SYSTEM BEHAVIOR:** The decision body may approve advancement of defense costs before a matter is finally resolved, but only after a written undertaking to repay is captured. Each advance is disbursed against a defense invoice and tracked against the running advance balance; if indemnification is ultimately not permitted, repayment is demanded. Advances remain subject to the federal screen in [RII-06](#rii-06-indemnification-exclusions). Advancement approval and undertaking records are write-restricted to the designated decision body under [RII-07](#rii-07-decision-process-and-conflicts).

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Advancement requested with defense invoice (`indemnification.advance.invoice_received`) | Written undertaking (`indemnification.undertaking`), defense budget (`indemnification.defense_budget`), defense invoice (`indemnification.defense_invoice`), federal screen result (`indemnification.federal_screen_result`) | Advance decision recorded (`indemnification.advance.decided`) | Internal: 30 days; enforced by `indemnification.advance_due_at` |
  | Advance approved and disbursed (`indemnification.advance.decided`) | Advance balance (`indemnification.advance_balance`), payment account (`official.payment_account`) | Advance disbursed (`indemnification.advance.disbursed`) | Internal: 15 BD of approval; enforced by `indemnification.advance_due_at` |
  | Indemnification ultimately not permitted (`indemnification.decision.recorded`) | Determination outcome (`indemnification.standard_determination.made`), advance balance (`indemnification.advance_balance`) | Repayment demanded (`indemnification.repayment.demanded`) | Internal: 30 days of final determination; enforced by `indemnification.payment_due_at` |

- **ALERTS/METRICS:** Alert on advances disbursed without a captured `indemnification.undertaking`, and on any unrecovered advance balance after a not-permitted determination; track total outstanding `indemnification.advance_balance`.

## RII-06 — Indemnification Exclusions  {#rii-06-indemnification-exclusions}

- **WHY (Reg cite):** Indemnification is prohibited for bad faith, knowing violations of law, breach of the duty of loyalty, and improper personal benefit under [California Corporations Code §317(b)](https://california.public.law/codes/ca_corp_code_section_317), and any payment barred by [FDIC Part 359](https://www.ecfr.gov/current/title-12/part-359) or [12 USC §1828(k)](https://www.law.cornell.edu/uscode/text/12/1828) is independently prohibited regardless of state-law permissibility.

- **SYSTEM BEHAVIOR:** Before any indemnification, advancement, or insurance-funded payment is disbursed, the system runs a federal/state exclusion screen testing for bad faith, knowing violations of law, breach of duty of loyalty, improper personal benefit, and any prohibited indemnification payment under FDIC Part 359 / 12 USC §1828(k). A flagged result blocks the payment and routes the matter to Legal. The screen runs even though Pynthia is not currently in troubled condition, because the federal bar applies to specific conduct categories regardless of condition. The screen ruleset and its results are write-restricted to Compliance and Legal.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Federal/state exclusion screen run on a pending payment (`indemnification.federal_screen.completed`) | Conduct record (`indemnification.conduct_record`), liability terms (`indemnification.liability_terms`), legal review (`indemnification.legal_review`) | Screen result recorded (`indemnification.federal_screen.completed`) | Before any payment; enforced by `indemnification.payment_due_at` |
  | Screen flags a prohibited payment (`indemnification.federal_screen.flagged`) | Federal screen result (`indemnification.federal_screen_result`), enforcement status (`indemnification.enforcement_status`) | Payment blocked and recorded (`indemnification.payment.blocked`) | Immediate on flag; no separate timer (gates `indemnification.payment_due_at`) |

- **ALERTS/METRICS:** Target zero payments disbursed without a completed federal screen; alert on every `indemnification.federal_screen.flagged` for Legal review and on any payment disbursed after a flag.

## RII-07 — Decision Process and Conflicts  {#rii-07-decision-process-and-conflicts}

- **WHY (Reg cite):** Indemnification decisions must be authorized by disinterested directors, independent legal counsel, or the members, with interested parties not participating, per [California Corporations Code §317(e)](https://california.public.law/codes/ca_corp_code_section_317); the conflict and recusal mechanics are governed by the Director Fiduciary Duties Policy and are cross-referenced here.

- **SYSTEM BEHAVIOR:** Every indemnification, advancement, and standard-of-conduct decision is routed to a qualified decision body — a disinterested-director quorum, an independent legal counsel opinion, or the members as applicable — and the system records which body decided. Interested officials must recuse; the recusal is captured before the determination is made, and a conflicted official voting on their own matter is blocked. The detailed fiduciary duty-of-loyalty standards and the conflict-of-interest framework live in the Director Fiduciary Duties Policy. Decision-body selection and recusal records are write-restricted to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Indemnification request routed to a decision body (`indemnification.request.received`) | Decision body selection (`indemnification.decision_body.selected`), disinterested quorum (`board.disinterested_quorum`), counsel opinion (`indemnification.counsel_opinion`) | Request routed and body recorded (`indemnification.request.received`, `indemnification.decision.recorded`) | Before determination; enforced by `indemnification.determination_due_at` |
  | Interested official identified for a matter (`coi.recusal_executed`) | Conflict identification (`coi.conflict_identified`), related party (`coi.related_party`), matter reference (`coi.matter_reference`) | Recusal executed and logged (`coi.recusal_executed`, `coi.recusal_logged`) | Before the vote/determination; no registered timer (gated by `indemnification.determination_due_at`) |

- **ALERTS/METRICS:** Target zero determinations recorded without a `indemnification.decision_body.selected` value and zero conflicted votes; alert on any matter decided without a recusal record where a conflict was identified.

## RII-08 — Claims Procedures  {#rii-08-claims-procedures}

- **WHY (Reg cite):** Timely carrier notice, cooperation, and document preservation protect the institution's insurance recovery that backstops indemnification under [California Corporations Code §317(i)](https://california.public.law/codes/ca_corp_code_section_317); document preservation on a potential claim is reinforced by legal-hold obligations referenced in the Record Retention Policy.

- **SYSTEM BEHAVIOR:** When a claim or potential claim against an official or the institution arises, the system notifies the relevant carriers within the policy-required window, opens a litigation hold over the claim's record scope, and routes communications through controlled channels. The hold is released only on confirmed resolution. Detailed retention schedules sit in the Record Retention Policy; carrier/broker oversight sits in the Third-Party Risk Policy. Claim records and the litigation hold are write-restricted to Legal and Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Claim or potential claim arises (`indemnification.claim.notified`) | Claim record scope (`claim.record_scope`), liability terms (`indemnification.liability_terms`) | Carrier notice sent (`insurance.carrier_notice.sent`) | Per policy terms (internal: 5 BD; enforced by `claim.carrier_notice_due_at`) |
  | Carrier notice issued (`insurance.carrier_notice.sent`) | Record scope (`claim.record_scope`), matter reference (`legal.matter_id`) | Litigation hold issued (`claim.litigation_hold.issued`) | Concurrent with notice; no registered timer (`claim.carrier_notice_due_at`) |
  | Claim resolved (`claim.matter.closed`) | Resolution record (`claim.resolution_record`), hold release authorization (`legal.hold_release_id`) | Matter closed and hold released (`claim.matter.closed`, `legal.hold_released`) | Internal: on confirmed resolution; no registered timer |

- **ALERTS/METRICS:** Alert on any claim where `claim.carrier_notice_due_at` is approaching or breached, and on litigation holds open past matter closure; target zero late carrier notices.

## RII-09 — Recordkeeping  {#rii-09-recordkeeping}

- **WHY (Reg cite):** Reimbursement approvals, insurance policies, and indemnification decisions must be retained to evidence compliance with [California Corporations Code §317](https://california.public.law/codes/ca_corp_code_section_317) and the federal bars in [FDIC Part 359](https://www.ecfr.gov/current/title-12/part-359) / [12 USC §1828(k)](https://www.law.cornell.edu/uscode/text/12/1828); D&O matters are typically retained permanently per the Record Retention Policy.

- **SYSTEM BEHAVIOR:** Each reimbursement approval, insurance policy/coverage schedule, and indemnification/advancement decision is captured as a retained record with a retention class and anchor date; D&O indemnification matters default to permanent retention. Records under an active claim are held under a legal hold and are not purged until the hold is released. The retention schedule itself is owned by the Record Retention Policy and cross-referenced here. Record creation and disposition authority is write-restricted to Compliance, and disposition of held records is blocked while a hold is active.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Reimbursement, insurance, or indemnification record created (`record.created`) | Record class (`record.retention_class`), retention anchor (`record.retention_anchor`), subject reference (`document.subject_ref`) | Record retained with retention clock set (`record.retention_clock_set`) | At creation; enforced by `record.retention_expires_at` |
  | Retention period reaches expiry for a non-held record (`record.retention_expired`) | Disposal eligibility (`record.disposal_eligible`), legal hold flag (`record.legal_hold_flag`), disposal method (`record.disposal_method`) | Disposition recorded (`record.disposed`) or held (`record.hold_applied`) | At schedule expiry; enforced by `record.disposal_due_at` (permanent for D&O matters) |

- **ALERTS/METRICS:** Target zero purges of records under an active legal hold; alert on records past `record.retention_expires_at` lacking a disposition decision and on any D&O record not flagged permanent.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for this policy, its controls, and the consolidated assumptions below.
- **Approver(s):** Patrick Wilson, Chief Compliance Officer.
- **Required participants:** The Board (and its disinterested-director quorum for indemnification decisions), the insurance broker/risk function, and Legal, each engaged as specified in the relevant control overlay.
- **Review cadence:** At least annually (next review per front-matter `next_review`), and upon any material change to the bylaws, articles, insurance program, or governing law. The insurance program is reviewed at least annually under [RII-02](#rii-02-insurance-program-maintenance).
- **Cross-references:** Director Fiduciary Duties Policy (duty-of-care/loyalty standards and conflict-of-interest recusal; anchors [RII-07](#rii-07-decision-process-and-conflicts)); Third-Party Risk Policy (broker/vendor selection and oversight; supports [RII-02](#rii-02-insurance-program-maintenance) and [RII-08](#rii-08-claims-procedures)); Record Retention Policy (retention periods and destruction; anchors [RII-09](#rii-09-recordkeeping)); Charitable Donation Accounts Policy (institutional charitable contributions — out of scope).

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** This policy reuses registered `core-vocabulary.json` codes where they fit (e.g., `official.*`, `indemnification.*`, `insurance.*`, `expense.*`, `coi.*`, `claim.*`, `record.*` and the registered `Task`/timer codes such as `indemnification.determination_due_at`, `indemnification.payment_due_at`, `indemnification.advance_due_at`, `insurance.review_due_at`, `claim.carrier_notice_due_at`, `expense.preapproval_due_at`, `expense.review_due_at`, `record.retention_expires_at`, `record.disposal_due_at`). A few field references (e.g., `indemnification.federal_screen_result`, `indemnification.legal_review`, `claim.record_scope`, `official.id`/`official.payment_account`) are taken verbatim from the parsed spec but their bindings to this policy's flows will be confirmed by engineering before the next review.
- **Bylaws and articles language unconfirmed.** The scope of mandatory vs. permissive indemnification and any advancement conditions depend on Pynthia's actual articles and bylaws under California Corporations Code §204(a)(10); this policy assumes the bylaws authorize indemnification and advancement to the full extent permitted by §317. Confirm the exact bylaw text and any narrower limits before finalizing.
- **Insurance program specifics unconfirmed.** Carriers, coverage limits, deductibles, claims-made vs. occurrence basis, Side A/B/C structure, and the applicable DFPI minimum fidelity-bond amount are placeholders pending confirmation against the actual program; [RII-02](#rii-02-insurance-program-maintenance) assumes all five coverages (D&O, E&O, fidelity bond, cyber, EPL) are or should be in force.
- **Charter and condition.** This policy assumes Pynthia is a California-chartered, DFPI-supervised credit union not currently in troubled condition; the FDIC Part 359 / 12 USC §1828(k) screen in [RII-06](#rii-06-indemnification-exclusions) is applied unconditionally because the federal bar attaches to specified conduct regardless of condition. Confirm charter type and applicable supervisory regime.
- **Decision-body composition.** [RII-07](#rii-07-decision-process-and-conflicts) assumes a disinterested-director quorum is normally available; where it is not, independent legal counsel or member vote is used. The thresholds for requiring counsel vs. board vs. members are not specified in Patrick's notes and should be set in coordination with the Director Fiduciary Duties Policy.
- **Pre-approval and reimbursement thresholds.** The dollar thresholds triggering pre-approval in [RII-01](#rii-01-business-expense-reimbursement) and the internal SLAs stated throughout (5/10/15/30/60 days) are minimal-viable assumptions and require confirmation by the CCO.
