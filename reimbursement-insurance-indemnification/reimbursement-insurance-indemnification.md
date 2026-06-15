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

## General Policy Statement

Pynthia Credit Union reimburses only reasonable and customary business expenses incurred by directors, officers, committee members, and volunteer officials; maintains an insurance program (D&O, E&O, fidelity bond, cyber, and EPL) sized to protect both officials and the institution; and indemnifies officials only within the limits permitted by California Corporations Code §317, the bylaws, and applicable federal restrictions (FDIC Part 359; 12 USC §1828(k)). Decision rights are centralized with the Chief Compliance Officer in coordination with the Board, the broker/risk function, and Legal, and interested officials must recuse from any matter in which they hold a personal interest. The institution will not reimburse personal or unsupported expenses, and will not indemnify bad-faith conduct, knowing violations of law, breaches of loyalty, or improper personal benefit.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Expense pre-approval above threshold | Official requests pre-approval (`official.expense_preapproval.requested`) | Before expense incurred (internal: 5 BD) | Reasonable-and-customary standard, category, threshold | [RII-01](#rii-01-business-expense-reimbursement) |
| Expense report reimbursement | Official submits report with receipts (`official.expense_report.submitted`) | 30 days of submission (internal: 10 BD) | Original receipts, category, exclusions | [RII-01](#rii-01-business-expense-reimbursement) |
| Annual insurance program review | Review cycle opens (`insurance.review.opened`) | At least annually | Coverages, limits, deductibles, basis, covered persons | [RII-02](#rii-02-insurance-program-maintenance) |
| Mandatory indemnification | Official prevails on the merits (`indemnification.request.received`) | Promptly on success (internal: 30 days) | Favorable disposition record, bylaw/§317 basis | [RII-03](#rii-03-mandatory-indemnification) |
| Permissive indemnification | Settlement/adverse judgment, standard-of-conduct test | Within decision SLA (internal: 60 days) | Conduct record, decision-body determination | [RII-04](#rii-04-permissive-indemnification) |
| Advancement of defense costs | Official requests advance (`indemnification.advance.requested`) | Promptly on undertaking (internal: 15 BD) | Written undertaking to repay | [RII-05](#rii-05-advancement-of-expenses) |
| Federal/exclusion screen | Any indemnification or advance request | Before any disbursement | Part 359 / §1828(k) screen result | [RII-06](#rii-06-indemnification-exclusions-and-federal-screen) |
| Decision body & recusal | Indemnification request routed | At determination | Disinterested directors / counsel opinion / member vote | [RII-07](#rii-07-decision-process-and-conflicts) |
| Carrier claim notice | Claim or potential claim arises (`indemnification.claim.notified`) | Per policy terms (internal: same day) | Carrier notice, cooperation, document preservation | [RII-08](#rii-08-claims-procedures-and-carrier-notice) |
| Record retention | Any reimbursement/insurance/indemnification artifact created | Per retention schedule (D&O: permanent) | Retention class & anchor | [RII-09](#rii-09-recordkeeping) |

## RII-01 — Business Expense Reimbursement  {#rii-01-business-expense-reimbursement}

- **WHY (Reg cite):** Reimbursement of official expenses is a corporate-authority and recordkeeping matter governed by the institution's articles and bylaws under [California Corporations Code §204(a)(10)](https://california.public.law/codes/ca_corp_code_section_204) and §317's expense-related framework ([Cal. Corp. Code §317](https://california.public.law/codes/ca_corp_code_section_317)); unsupported or personal payments to officials can also implicate federal restrictions on improper benefit under [12 USC §1828(k)](https://www.law.cornell.edu/uscode/text/12/1828).
- **SYSTEM BEHAVIOR:** The system accepts a pre-approval request for any expense estimated above the defined threshold and routes it to the Chief Compliance Officer (or delegate) for a decision before the expense is incurred; reimbursable categories are travel, lodging, meals, education/training, and board materials, each held to a reasonable-and-customary standard. On submission of an expense report, the system requires original receipts and matches each line to an approved category, blocking reimbursement for personal or unsupported items as exclusions. Reimbursement amounts below the pre-approval threshold proceed without pre-approval but still require receipts and category validation. Approval authority and the reimbursement-decision step are write-restricted to the Chief Compliance Officer and finance delegates; officials cannot approve their own reports.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Official requests pre-approval above threshold (`official.expense_preapproval.requested`) | Official identity (`official.id`), category (`expense.category`), estimated amount (`expense.estimated_amount`), purpose (`expense.purpose`) | Pre-approval decision record (`official.expense_preapproval.decided`) | Before expense incurred (internal: 5 BD; enforced by `expense.preapproval_due_at`) |
  | Official submits expense report with receipts (`official.expense_report.submitted`) | Official identity (`official.id`), report (`expense.report_id`), category (`expense.category`), amount (`expense.amount`), pre-approval reference (`expense.preapproval_id`), payment account (`official.payment_account`) | Reimbursement decision and disbursement (`official.expense_report.decided`, `official.reimbursement.disbursed`) | 30 days (internal: 10 BD; enforced by `expense.review_due_at`) |

- **ALERTS/METRICS:** Alert on expense reports aging past the 10-BD internal SLA and on any reimbursement attempted without a matched receipt or required pre-approval; target zero disbursements lacking original receipts and zero self-approved reports.

## RII-02 — Insurance Program Maintenance  {#rii-02-insurance-program-maintenance}

- **WHY (Reg cite):** Maintaining adequate official and institutional coverage — including the fidelity bond required of state-chartered institutions — is grounded in DFPI minimum fidelity-bond requirements and the indemnification framework the program backstops under [Cal. Corp. Code §317](https://california.public.law/codes/ca_corp_code_section_317); a deficient bond also exposes the institution to safety-and-soundness criticism.
- **SYSTEM BEHAVIOR:** The system maintains a coverage schedule enumerating each policy carried — D&O (Side A/B/C), E&O, the fidelity bond, cyber liability, and Employment Practices Liability — with limits, deductibles, claims-made vs. occurrence basis, and the persons covered, and opens a review cycle at least annually. The annual review compares the fidelity-bond terms against the DFPI minimum and flags any deficiency for remediation; bound-policy and schedule updates are recorded as they occur. Carriers, coverage limits, and bylaw alignment are confirmed against Pynthia's actual program before any schedule is treated as authoritative. The coverage schedule and review records are write-restricted to the Chief Compliance Officer and the broker/risk function.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual insurance review cycle opens (`insurance.review.opened`) | Coverage schedule (`insurance.coverage_schedule`), policy terms (`insurance.policy_terms`), fidelity-bond terms (`insurance.fidelity_bond_terms`), DFPI minimum (`insurance.dfpi_minimum`) | Completed review and updated schedule (`insurance.review.completed`, `insurance.coverage_schedule.updated`) | At least annually (enforced by `insurance.review_due_at`) |
  | Fidelity bond found below DFPI minimum (`insurance.deficiency.reported`) | Fidelity-bond deficiency flag (`insurance.fidelity_bond.deficient`), required adjustment (`insurance.bond.adjustment`) | Deficiency report + remediation plan (`insurance.deficiency.reported`) | Promptly on detection (internal: 30 days; enforced by `insurance.review_due_at`) |
  | New or renewed policy bound (`insurance.policy.bound`) | Policy terms (`insurance.policy_terms`), coverage schedule (`insurance.coverage_schedule`) | Updated coverage schedule (`insurance.coverage_schedule.updated`) | Same cycle (internal: 5 BD) |

- **ALERTS/METRICS:** Alert when the annual review is overdue and when fidelity-bond coverage drops below the DFPI minimum; track time-to-remediation for any flagged deficiency and target zero lapses in any required coverage line.

## RII-03 — Mandatory Indemnification  {#rii-03-mandatory-indemnification}

- **WHY (Reg cite):** A director or officer who is successful on the merits in defending a proceeding is entitled to mandatory indemnification under [Cal. Corp. Code §317(d)](https://california.public.law/codes/ca_corp_code_section_317), to the extent required by the bylaws adopted under [§204(a)(10)](https://california.public.law/codes/ca_corp_code_section_204).
- **SYSTEM BEHAVIOR:** When an indemnification request reports that the official prevailed on the merits, the system confirms the favorable disposition and authorizes mandatory indemnification for the reasonable expenses actually incurred, recording the bylaw/§317 basis. Mandatory authorization is still gated by the federal/exclusion screen in [RII-06](#rii-06-indemnification-exclusions-and-federal-screen) so that no payment barred by Part 359 or §1828(k) is disbursed. Where the official succeeded only partially, only the expenses attributable to the successful defense are mandatorily indemnified, with the remainder routed to permissive review under [RII-04](#rii-04-permissive-indemnification). Mandatory-authorization records are write-restricted to the Chief Compliance Officer and Legal.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Indemnification request received reporting success on the merits (`indemnification.request.received`) | Request (`indemnification.request`), favorable disposition (`indemnification.matter.resolved_favorably`), disposition record (`indemnification.disposition_record`), expense statement (`indemnification.expense_statement`) | Mandatory indemnification authorized (`indemnification.mandatory.authorized`) | Promptly on success (internal: 30 days; enforced by `indemnification.determination_due_at`) |

- **ALERTS/METRICS:** Alert on any mandatory-indemnification request open past 30 days and on any authorization that bypassed the federal screen; target zero authorizations issued without a recorded favorable disposition.

## RII-04 — Permissive Indemnification  {#rii-04-permissive-indemnification}

- **WHY (Reg cite):** Indemnification for settlements or adverse judgments is permitted only where the official acted in good faith and in a manner reasonably believed to be in the institution's best interest, per the standard of conduct in [Cal. Corp. Code §317(b)–(c)](https://california.public.law/codes/ca_corp_code_section_317).
- **SYSTEM BEHAVIOR:** For matters resolved by settlement or adverse judgment, the system records the conduct evidence and routes the request to the appropriate decision body (per [RII-07](#rii-07-decision-process-and-conflicts)) to make the statutory standard-of-conduct determination before any payment is decided. Indemnification is permitted only when the standard determination is affirmative and the federal/exclusion screen in [RII-06](#rii-06-indemnification-exclusions-and-federal-screen) clears. A negative standard determination blocks payment and the request is closed with the rationale recorded. Conduct records, standard determinations, and payment decisions are write-restricted to the Chief Compliance Officer, the decision body, and Legal.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Permissive request routed for standard-of-conduct determination (`indemnification.request.routed`) | Conduct record (`indemnification.conduct_record`), liability terms (`indemnification.liability_terms`), counsel opinion (`indemnification.counsel_opinion`), decision body (`indemnification.decision_body`) | Standard determination made (`indemnification.standard_determination.made`) | Internal: 45 days (enforced by `indemnification.determination_due_at`) |
  | Standard determination affirmative and screen cleared (`indemnification.decision.recorded`) | Standard determination (`indemnification.standard_determination.made`), federal screen result (`indemnification.federal_screen_result`), disposition record (`indemnification.disposition_record`) | Indemnification decision and payment (`indemnification.decision.recorded`, `indemnification.payment.disbursed`) | Internal: 60 days (enforced by `indemnification.payment_due_at`) |

- **ALERTS/METRICS:** Alert on permissive requests lacking a recorded standard determination at the 45-day mark and on any payment disbursed without an affirmative determination; target zero permissive payments absent a documented good-faith finding.

## RII-05 — Advancement of Expenses  {#rii-05-advancement-of-expenses}

- **WHY (Reg cite):** Advancement of defense costs prior to final disposition is permitted upon receipt of an undertaking to repay if indemnification is ultimately found not permitted, per [Cal. Corp. Code §317(f)](https://california.public.law/codes/ca_corp_code_section_317).
- **SYSTEM BEHAVIOR:** The system accepts an advance request and requires a signed written undertaking to repay before any defense costs are disbursed; the federal/exclusion screen in [RII-06](#rii-06-indemnification-exclusions-and-federal-screen) must clear first. Advances track against incurred defense invoices and an advance balance, and if indemnification is ultimately found not permitted the system demands repayment of the outstanding balance. An advance request without a recorded undertaking is blocked from disbursement. Advance decisions, undertakings, and repayment demands are write-restricted to the Chief Compliance Officer and Legal.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Official requests advancement of defense costs (`indemnification.advance.requested`) | Advance request (`indemnification.advance.requested`), signed undertaking (`indemnification.undertaking`), federal screen result (`indemnification.federal_screen_result`), defense budget (`indemnification.defense_budget`) | Advance decision and disbursement (`indemnification.advance.decided`, `indemnification.advance.disbursed`) | Promptly on undertaking (internal: 15 BD; enforced by `indemnification.advance_due_at`) |
  | Defense invoice received against open advance (`indemnification.advance.invoice_received`) | Defense invoice (`indemnification.defense_invoice`), advance balance (`indemnification.advance_balance`) | Advance disbursement recorded (`indemnification.advance.disbursed`) | Internal: 10 BD (enforced by `indemnification.advance_due_at`) |
  | Indemnification ultimately not permitted | Disposition record (`indemnification.disposition_record`), advance balance (`indemnification.advance_balance`), enforcement status (`indemnification.enforcement_status`) | Repayment demand issued (`indemnification.repayment.demanded`) | Promptly on final disposition (internal: 30 days; enforced by `indemnification.payment_due_at`) |

- **ALERTS/METRICS:** Alert on any advance disbursed without a recorded undertaking and on advance balances unrecovered past the repayment SLA after an adverse determination; target zero advances lacking an undertaking on file.

## RII-06 — Indemnification Exclusions and Federal Screen  {#rii-06-indemnification-exclusions-and-federal-screen}

- **WHY (Reg cite):** Indemnification is prohibited for bad faith, knowing violations of law, breach of the duty of loyalty, and transactions involving improper personal benefit under [Cal. Corp. Code §317(b)](https://california.public.law/codes/ca_corp_code_section_317), and any payment barred by [FDIC Part 359 (12 CFR Part 359)](https://www.ecfr.gov/current/title-12/part-359) or [12 USC §1828(k)](https://www.law.cornell.edu/uscode/text/12/1828) must be blocked even though Pynthia is not currently in troubled condition.
- **SYSTEM BEHAVIOR:** Before any indemnification payment or advance disbursement, the system runs a federal/exclusion screen evaluating the matter against the statutory bars (bad faith, knowing violation, loyalty breach, improper personal benefit) and against Part 359 / §1828(k); a flagged result blocks the payment and routes the matter to Legal. The screen is a mandatory gate for [RII-03](#rii-03-mandatory-indemnification), [RII-04](#rii-04-permissive-indemnification), and [RII-05](#rii-05-advancement-of-expenses) — no disbursement event may fire until the screen clears. Where the institution's condition would trigger Part 359 prohibitions, the screen blocks payment regardless of the §317 analysis. Screen execution and the payment-block flag are write-restricted to the Chief Compliance Officer and Legal.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Indemnification or advance request enters payment gate (`indemnification.request.received`) | Conduct record (`indemnification.conduct_record`), liability terms (`indemnification.liability_terms`), legal review (`indemnification.legal_review`) | Federal/exclusion screen completed (`indemnification.federal_screen.completed`) | Before any disbursement (internal: 5 BD; enforced by `indemnification.determination_due_at`) |
  | Screen identifies a statutory bar or Part 359/§1828(k) prohibition | Federal screen result (`indemnification.federal_screen_result`), legal review (`indemnification.legal_review`) | Screen flagged + payment blocked (`indemnification.federal_screen.flagged`, `indemnification.payment.blocked`) | Immediately on detection (internal: same day) |

- **ALERTS/METRICS:** Alert on any disbursement event preceded by a flagged or missing screen result; target zero indemnification or advance payments without a completed, cleared federal screen.

## RII-07 — Decision Process and Conflicts  {#rii-07-decision-process-and-conflicts}

- **WHY (Reg cite):** The indemnification determination must be made by disinterested directors, independent legal counsel, or the members as applicable, with interested officials recused, per [Cal. Corp. Code §317(e)](https://california.public.law/codes/ca_corp_code_section_317); recusal mechanics cross-reference the Director Fiduciary Duties Policy's conflict-of-interest framework.
- **SYSTEM BEHAVIOR:** When an indemnification request is routed, the system selects and records the appropriate decision body (disinterested directors with a disinterested quorum, an independent legal-counsel opinion, or a member vote) and verifies that any interested official is recused before the determination is recorded. A conflicted official who has not recused blocks the determination from being recorded. The detailed duty-of-care/duty-of-loyalty analysis and the general conflict-of-interest recusal rules live in the Director Fiduciary Duties Policy and are not restated here. Decision-body selection and recusal records are write-restricted to the Chief Compliance Officer, the Board secretary, and Legal.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Indemnification request routed for decision (`indemnification.request.routed`) | Decision body selection (`indemnification.decision_body.selected`), disinterested quorum (`board.disinterested_quorum`), recusal record (`indemnification.recusal_record`), counsel opinion (`indemnification.counsel_opinion`) | Recusal executed and decision body recorded (`coi.recusal_executed`, `indemnification.decision.recorded`) | At determination (internal: 45 days; enforced by `indemnification.determination_due_at`) |
  | Conflicted official identified on the matter (`coi.conflict_identified`) | Conflicted-matter flag (`board.agenda_item_flagged_conflicted`), interest description (`coi.interest_description`), recusal record (`coi.recusal_record`) | Recusal logged (`coi.recusal_logged`) | Before the determination is recorded (internal: same meeting) |

- **ALERTS/METRICS:** Alert on any determination recorded without a documented disinterested quorum or counsel opinion, and on any conflicted official voting on their own matter; target zero determinations made by an interested body.

## RII-08 — Claims Procedures and Carrier Notice  {#rii-08-claims-procedures-and-carrier-notice}

- **WHY (Reg cite):** Timely carrier notice, cooperation, and document preservation protect both the official and the institution under the claims-made D&O/E&O policies maintained per [Cal. Corp. Code §317(i)](https://california.public.law/codes/ca_corp_code_section_317) and preserve coverage that the indemnification framework relies upon; document preservation also intersects with legal-hold obligations.
- **SYSTEM BEHAVIOR:** When a claim or potential claim against an official arises, the system notifies the relevant carrier within the policy's notice window, opens a litigation hold to preserve documents, and routes communications through controlled channels (Legal and the Chief Compliance Officer). For claims-made policies, notice must be given within the policy period to preserve coverage, so the carrier-notice timer is treated as same-day from awareness. Detailed retention/destruction mechanics for the preserved records live in the Record Retention Policy and are not restated here. Carrier-notice records and litigation-hold actions are write-restricted to Legal and the Chief Compliance Officer.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Claim or potential claim notified (`indemnification.claim.notified`) | Claim notification (`indemnification.claim.notified`), record scope (`claim.record_scope`), carrier contacts (`insurance.coverage_schedule`) | Carrier notice sent (`insurance.carrier_notice.sent`) | Per policy terms (internal: same day; enforced by `claim.carrier_notice_due_at`) |
  | Document preservation required for a noticed claim (`claim.litigation_hold.issued`) | Hold scope (`legal.hold_scope`), matter id (`legal.matter_id`) | Litigation hold issued (`legal.hold_placed`, `legal_hold.created`) | Same day as carrier notice (internal: 1 BD) |
  | Claim matter resolved (`claim.matter.closed`) | Resolution record (`claim.resolution_record`), hold release authorization (`legal.hold_release_id`) | Matter closed and hold released (`claim.matter.closed`, `legal.hold_released`) | Promptly on resolution (internal: 10 BD) |

- **ALERTS/METRICS:** Alert on any claim awareness without a same-day carrier notice and on any noticed claim without an open litigation hold; target zero coverage denials attributable to late notice.

## RII-09 — Recordkeeping  {#rii-09-recordkeeping}

- **WHY (Reg cite):** Retention of reimbursement approvals, insurance policies, and indemnification decisions evidences compliance with the authorizing bylaws and statutory standards under [Cal. Corp. Code §317](https://california.public.law/codes/ca_corp_code_section_317) and supports examiner review; D&O indemnification matters are typically retained permanently.
- **SYSTEM BEHAVIOR:** The system assigns a retention class and anchor date to each reimbursement approval, insurance policy/schedule, and indemnification decision when it is created, and sets the retention timer accordingly — D&O indemnification matters are classed for permanent retention. Records under an active litigation hold (per [RII-08](#rii-08-claims-procedures-and-carrier-notice)) are exempt from destruction until the hold is released. The detailed retention schedule, destruction cadence, and disposal mechanics are owned by the Record Retention Policy and are not restated here. Retention-class assignment and hold flags are write-restricted to the records function and the Chief Compliance Officer.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Reimbursement, insurance, or indemnification artifact created | Record class (`record.retention_class`), retention anchor (`retention.anchor_date`), legal-hold flag (`record.legal_hold_flag`) | Retention clock set (`record.retention_clock_set`, `retention.timer_set`) | At creation (internal: 1 BD; enforced by `record.retention_expires_at`) |
  | Litigation hold placed on a covered record (`record.hold_placed`) | Hold scope (`record.hold_scope`), matter id (`record.matter_id`), hold authorizer (`record.hold_authorizer`) | Hold applied; destruction suspended (`record.hold_applied`) | Same day as hold (internal: 1 BD) |

- **ALERTS/METRICS:** Alert on any D&O indemnification record not classed for permanent retention and on any destruction attempted against a held record; target zero destructions of records under active hold.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for the policy, its controls, and exception handling.
- **Approvers:** Patrick Wilson, Chief Compliance Officer.
- **Required participants:** the Board (indemnification determinations and disinterested quorum), the insurance broker/risk function (coverage schedule and annual review), and Legal (standard-of-conduct review, federal screen, carrier notice, and litigation holds).
- **Review cadence:** at least annually (next review {{2027-06-15}}), or upon a material change in the bylaws, the insurance program, or applicable law; the policy review is tracked under `policy.review_due_at`.
- **Cross-references:** Director Fiduciary Duties Policy (duty-of-care/loyalty standards and conflict-of-interest recusal rules); Third-Party Risk Policy (broker/vendor selection and oversight); Record Retention Policy (retention periods, destruction, and disposal of insurance and indemnification records); Charitable Donation Accounts Policy (institutional charitable contributions).

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** Several field, event, and timer codes referenced in the EVENTS tables are drawn from registered or provisional vocabulary but are not yet bound to these specific controls in `core-vocabulary.json`. The `official.*`, `expense.*`, `insurance.*`, and `indemnification.*` subjects and events (e.g., `official.expense_preapproval.requested`, `insurance.review.opened`, `indemnification.federal_screen.completed`, `indemnification.payment.blocked`) are registered; provisional spellings used verbatim include `indemnification.legal_review`, `expense.amount`, `expense.purpose`, `official.id`, and `legal.hold_scope` / `legal.matter_id` / `record.id`. Engineering will confirm bindings before the next review.
- **Composed codes flagged.** No new subjects, verbs, or task types were minted. Where no pre-bound event existed, composition reused registered subjects/verbs (e.g., `indemnification.claim.notified`, `indemnification.request.routed` map to the registered `indemnification` subject and `received`/`notified` verbs). Deadlines use registered `Task`-pattern timers (`expense.preapproval_due_at`, `expense.review_due_at`, `insurance.review_due_at`, `indemnification.determination_due_at`, `indemnification.advance_due_at`, `indemnification.payment_due_at`, `claim.carrier_notice_due_at`, `record.retention_expires_at`); no per-domain due-date fields were coined.
- **Bylaw and §317 alignment unconfirmed.** This policy operationalizes "the limits permitted by law" and "to the extent required by the bylaws," but Pynthia's actual articles and bylaw indemnification language have not been supplied. Specific mandatory-vs-permissive triggers, any broader-than-statutory indemnification grant, and authorization-in-articles per §204(a)(10) must be confirmed against the actual governing documents before finalization.
- **Insurance program specifics unconfirmed.** Carriers, coverage limits, deductibles, claims-made vs. occurrence basis, Side A/B/C structure, and the list of covered persons are placeholders; the actual program must be confirmed against Pynthia's bound policies and the DFPI fidelity-bond minimum.
- **Reimbursement thresholds undefined.** PATRICK_NOTES require pre-approval "above defined thresholds" but no dollar thresholds were provided; the system enforces a configurable threshold whose value must be set and approved by the Chief Compliance Officer.
- **Charter and federal applicability.** The policy assumes a California state-chartered, federally insured credit union for which Cal. Corp. Code §317, DFPI fidelity-bond rules, FDIC Part 359, and 12 USC §1828(k) all apply; confirm charter type and federal-deposit-insurance status. Part 359 obligations are treated as a mandatory screen even though Pynthia is not currently in troubled condition.
- **Decision-body and recusal mechanics depend on a sister policy.** The disinterested-director quorum rules and conflict-of-interest recusal framework are owned by the Director Fiduciary Duties Policy; this policy assumes that framework exists and is enforced, and only records its outputs.
