```yaml
---
title: Reimbursement, Insurance, and Indemnification of Officials Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2025-07-01
next_review: 2026-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Governance, Indemnification, Insurance, Reimbursement, Officials]
---
```

## General Policy Statement

Pynthia Credit Union is committed to governing the reimbursement of reasonable business expenses incurred by directors, officers, committee members, and volunteers; maintaining an insurance program that protects those officials and the institution; and indemnifying officials for liabilities arising from their service within the limits permitted by law. This policy applies to all directors, officers, committee members, and volunteer officials of Pynthia Credit Union. It operationalizes the indemnification commitments in Pynthia's articles and bylaws consistent with California Corporations Code §317, subject to the federal payment restrictions of [12 CFR Part 359](https://www.ecfr.gov/current/title-12/part-359) and [12 U.S.C. §1828(k)](https://www.law.cornell.edu/uscode/text/12/1828). The Chief Compliance Officer owns this policy; the Board, insurance broker/risk function, and Legal are required participants in its governance. Decisions under this policy must be defensible, conflict-free, and compliant with all applicable authorities.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Expense report submitted by official | Official submits expense report (`official.expense_report.submitted`) | 30 days from submission (internal: 10 BD) | Reimbursable categories, R&C standard, receipts | [RII-01](#rii-01-business-expense-reimbursement) |
| Pre-approval request above threshold | Official requests pre-approval (`official.expense_preapproval.decided`) | Before expense is incurred | Threshold schedule, purpose documentation | [RII-01](#rii-01-business-expense-reimbursement) |
| Annual insurance program review | Calendar year-end or policy renewal (`insurance.review.opened`) | Annually (internal: 60 days before renewal) | Coverage schedule, limits, deductibles | [RII-02](#rii-02-insurance-program-maintenance) |
| Fidelity bond deficiency detected | Bond terms fall below DFPI minimum (`insurance.deficiency.reported`) | Immediate cure; notify DFPI per applicable rule | Bond terms, DFPI minimum | [RII-02](#rii-02-insurance-program-maintenance) |
| Claim or potential claim arises | Official or institution learns of claim (`indemnification.request.received`) | Carrier notice within policy-specified period (internal: 5 BD) | Claim notice, document preservation | [RII-06](#rii-06-claims-procedures) |
| Mandatory indemnification request | Official succeeds on merits (`indemnification.mandatory.authorized`) | Reasonable time after final resolution (internal: 30 days) | Proof of favorable outcome, legal review | [RII-03](#rii-03-mandatory-indemnification) |
| Permissive indemnification request | Official requests indemnification for settlement/judgment (`indemnification.request.received`) | Determination within 60 days of complete submission (internal: 45 days; enforced by `indemnification.determination_due_at`) | Conduct record, standard-of-conduct determination | [RII-04](#rii-04-permissive-indemnification) |
| Advancement of expenses requested | Official requests advancement of defense costs (`indemnification.advance.decided`) | Decision within 15 BD of written undertaking (enforced by `indemnification.advance_due_at`) | Written undertaking to repay | [RII-05](#rii-05-advancement-of-expenses) |
| Federal exclusion screen required | Any indemnification payment proposed (`indemnification.federal_screen.completed`) | Before any payment disbursed | Federal screen result, enforcement status | [RII-06-excl](#rii-06-indemnification-exclusions) |
| Indemnification decision required | Decision body convened (`indemnification.decision.recorded`) | Within 60 days of complete request (enforced by `indemnification.determination_due_at`) | Disinterested quorum, counsel opinion if needed | [RII-07](#rii-07-decision-process-and-conflicts) |
| Recordkeeping — reimbursement | Expense report approved or denied (`official.expense_report.decided`) | Per retention schedule (internal: 7 years) | Approval record, receipts | [RII-09](#rii-09-recordkeeping) |
| Recordkeeping — indemnification | Indemnification decision recorded (`indemnification.decision.recorded`) | Permanent retention | Decision record, counsel opinion, undertaking | [RII-09](#rii-09-recordkeeping) |

---

## RII-01 — Business Expense Reimbursement {#rii-01-business-expense-reimbursement}

**WHY (Reg cite):** Credit union governance best practice and NCUA supervisory expectations require that institutional funds disbursed to officials be limited to legitimate, documented business expenses. Pynthia's bylaws and California Corporations Code general fiduciary standards require that expenditures of institutional funds be reasonable and in the institution's interest. Excessive or unsupported reimbursements can constitute improper personal benefit, triggering indemnification exclusions and potential regulatory criticism.

**SYSTEM BEHAVIOR:** The system enforces a two-gate workflow: (1) pre-approval for expenses above the defined threshold before the expense is incurred, and (2) post-submission review of the expense report with original receipts. Reimbursable categories are: travel (airfare, ground transport, lodging), meals (business purpose required), education and training (board-approved programs), and board materials (subscriptions, publications). Personal expenses, expenses lacking original receipts, and expenses that fail the reasonable-and-customary standard are excluded and returned without payment. The CCO or designee reviews all submissions; the Board Treasurer reviews submissions by the CCO. Write access to expense approval decisions is restricted to the CCO and Board Treasurer roles.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Official submits expense report (`official.expense_report.submitted`) | Official identity (`official.id`), expense category (`expense.category`), amount (`expense.amount`), purpose (`expense.purpose`), original receipts attached, pre-approval reference if above threshold (`expense.preapproval_id`) | Expense report record created; decision pending (`official.expense_report.decided` on approval or denial) | 30 days from submission (internal: 10 BD; enforced by `expense.review_due_at`) |
| Official requests pre-approval for above-threshold expense (`official.expense_preapproval.decided`) | Official identity (`official.id`), estimated amount (`expense.estimated_amount`), purpose (`expense.purpose`), category (`expense.category`), event or program details | Pre-approval granted or denied (`official.expense_preapproval.decided`); pre-approval ID issued (`expense.preapproval_id`) | Before expense is incurred (internal: 5 BD from request; enforced by `expense.preapproval_due_at`) |
| Expense report approved — reimbursement disbursed | Approved expense report (`expense.report_id`), payment account (`official.payment_account`) | Reimbursement disbursed and logged (`official.reimbursement.disbursed`) | Within 10 BD of approval |
| Expense report denied — official notified | Denial reason, original submission | Denial recorded (`official.expense_report.decided`); official notified | Within 10 BD of submission |

**ALERTS/METRICS:** Alert when any expense report remains unreviewed beyond 10 BD (`expense.review_due_at` breached). Monthly metric: count of pre-approval waivers granted; target zero waivers for above-threshold expenses lacking pre-approval. Quarterly metric: ratio of denied to submitted reports; spikes trigger CCO review.

---

## RII-02 — Insurance Program Maintenance {#rii-02-insurance-program-maintenance}

**WHY (Reg cite):** DFPI fidelity-bond requirements mandate minimum bond coverage for state-chartered credit unions. NCUA supervisory guidance and sound governance practice require that credit unions maintain adequate D&O, E&O, cyber, and EPLI coverage. Gaps in coverage leave directors and the institution exposed to unindemnified liability. The fidelity bond is a regulatory floor; all other coverages are governance floors set by the Board.

**SYSTEM BEHAVIOR:** The CCO, in coordination with the insurance broker and risk function, maintains a coverage schedule (`insurance.coverage_schedule`) documenting each policy line: Directors & Officers liability (with Side A individual, Side B corporate reimbursement, and Side C entity coverage identified), Errors & Omissions, fidelity bond, cyber liability, and Employment Practices Liability. For each line the schedule records: carrier, policy number, limit, deductible, claims-made vs. occurrence basis, covered persons, and renewal date. The program is reviewed at least annually before renewal. If the fidelity bond falls below the DFPI minimum, the deficiency is reported immediately and cure is initiated. Write access to the coverage schedule is restricted to the CCO and the risk/broker function.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual insurance review cycle opens (`insurance.review.opened`) | Current coverage schedule (`insurance.coverage_schedule`), DFPI minimum bond amount (`insurance.dfpi_minimum`), prior-year claims history, broker recommendation | Review initiated; coverage schedule updated (`insurance.coverage_schedule.updated`) | Annually; internal: 60 days before earliest policy renewal (enforced by `insurance.review_due_at`) |
| Annual review completed — program confirmed adequate (`insurance.review.completed`) | Updated coverage schedule, Board approval or ratification record | Review completion logged (`insurance.review.completed`); Board notified | Within 30 days of review open |
| Fidelity bond deficiency detected (`insurance.deficiency.reported`) | Current bond terms (`insurance.fidelity_bond_terms`), DFPI minimum (`insurance.dfpi_minimum`), deficiency amount | Deficiency reported (`insurance.deficiency.reported`); cure task created; carrier notice sent (`insurance.carrier_notice.sent`) | Immediate on detection; cure initiated within 5 BD |
| Policy bound or renewed (`insurance.policy.bound`) | Carrier confirmation, updated policy terms (`insurance.policy_terms`), coverage schedule | Coverage schedule updated (`insurance.coverage_schedule.updated`); bound event logged (`insurance.policy.bound`) | On or before policy effective date |

**ALERTS/METRICS:** Alert when `insurance.review_due_at` is within 30 days and review has not been opened. Alert immediately on `insurance.fidelity_bond.deficient` flag. Annual metric: zero coverage gaps across all required lines at any point during the year.

---

## RII-03 — Mandatory Indemnification {#rii-03-mandatory-indemnification}

**WHY (Reg cite):** [California Corporations Code §317(d)](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=317.&lawCode=CORP) requires a corporation to indemnify an agent who has been successful on the merits in defense of any proceeding to which the agent was a party by reason of the agent's status. Pynthia's bylaws operationalize this mandatory floor. Mandatory indemnification is not discretionary; it must be paid upon proof of favorable outcome, subject only to the federal payment restrictions of [12 CFR Part 359](https://www.ecfr.gov/current/title-12/part-359) and [12 U.S.C. §1828(k)](https://www.law.cornell.edu/uscode/text/12/1828).

**SYSTEM BEHAVIOR:** When an official provides proof of a final favorable outcome (dismissal, acquittal, or judgment in their favor) in a proceeding arising from their service, the CCO initiates mandatory indemnification processing. Legal reviews the outcome record to confirm it qualifies as "successful on the merits." A federal screen is run before any payment is disbursed to confirm no Part 359 or §1828(k) bar applies. No conduct-standard determination is required for mandatory indemnification. Write access to mandatory indemnification authorization is restricted to the CCO and Legal.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Official submits proof of favorable outcome (`indemnification.request.received`) | Official identity (`official.id`), matter description (`indemnification.request`), court or tribunal disposition record (`indemnification.disposition_record`), itemized defense expenses (`indemnification.expense_statement`) | Request received and logged (`indemnification.request.received`); routed to Legal (`indemnification.request.routed`) | Immediately on receipt |
| Legal confirms favorable outcome qualifies (`indemnification.mandatory.authorized`) | Disposition record, legal review memo (`indemnification.legal_review`) | Mandatory indemnification authorized (`indemnification.mandatory.authorized`); federal screen initiated | Within 15 BD of complete submission |
| Federal screen completed (`indemnification.federal_screen.completed`) | Enforcement status (`indemnification.enforcement_status`), federal screen result (`indemnification.federal_screen_result`) | Screen result logged (`indemnification.federal_screen.completed`); if clear, payment authorized | Within 5 BD of authorization |
| Payment disbursed (`indemnification.payment.disbursed`) | Payment authorization, official payment account (`official.payment_account`), liability terms (`indemnification.liability_terms`) | Payment disbursed and logged (`indemnification.payment.disbursed`) | Within 30 days of favorable outcome confirmation (enforced by `indemnification.payment_due_at`) |

**ALERTS/METRICS:** Alert when a mandatory indemnification request has been open for more than 15 BD without Legal confirmation. Alert if federal screen flags a potential bar (`indemnification.federal_screen.flagged`). Target: zero mandatory indemnification payments made without a completed federal screen.

---

## RII-04 — Permissive Indemnification {#rii-04-permissive-indemnification}

**WHY (Reg cite):** [California Corporations Code §317(b)–(c)](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=317.&lawCode=CORP) permits a corporation to indemnify an agent against expenses, judgments, fines, settlements, and other amounts actually and reasonably incurred in connection with a proceeding if the agent acted in good faith and in a manner the agent reasonably believed to be in the best interests of the corporation. Permissive indemnification for settlements or adverse judgments requires a conduct-standard determination and is subject to the federal payment restrictions of [12 CFR Part 359](https://www.ecfr.gov/current/title-12/part-359) and [12 U.S.C. §1828(k)](https://www.law.cornell.edu/uscode/text/12/1828).

**SYSTEM BEHAVIOR:** When an official requests indemnification for a settlement, adverse judgment, or other non-favorable outcome, the CCO routes the request to the decision body (see [RII-07](#rii-07-decision-process-and-conflicts)) for a conduct-standard determination. The decision body must find that the official acted in good faith and with a reasonable belief that the action was in Pynthia's best interest. If the standard is met, a federal screen is run before any payment. If the standard is not met, indemnification is denied. Permissive indemnification for criminal proceedings requires the additional finding that the official had no reasonable cause to believe the conduct was unlawful. Write access to the conduct-standard determination is restricted to the decision body and Legal.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Official requests permissive indemnification (`indemnification.request.received`) | Official identity (`official.id`), matter description (`indemnification.request`), conduct record (`indemnification.conduct_record`), itemized expenses or settlement amount (`indemnification.expense_statement`), defense budget (`indemnification.defense_budget`) | Request received and logged (`indemnification.request.received`); routed to decision body (`indemnification.request.routed`) | Immediately on receipt |
| Decision body makes conduct-standard determination (`indemnification.standard_determination.made`) | Conduct record, counsel opinion if required (`indemnification.counsel_opinion`), decision body composition (`indemnification.decision_body`), recusal record (`indemnification.recusal_record`) | Standard determination recorded (`indemnification.standard_determination.made`); decision recorded (`indemnification.decision.recorded`) | Within 60 days of complete submission (enforced by `indemnification.determination_due_at`) |
| Federal screen completed — payment authorized (`indemnification.federal_screen.completed`) | Federal screen result (`indemnification.federal_screen_result`), enforcement status (`indemnification.enforcement_status`) | Screen result logged (`indemnification.federal_screen.completed`); if clear, payment authorized | Within 5 BD of determination |
| Payment disbursed or blocked (`indemnification.payment.disbursed` or `indemnification.payment.blocked`) | Payment authorization or block reason, official payment account (`official.payment_account`) | Payment disbursed (`indemnification.payment.disbursed`) or blocked (`indemnification.payment.blocked`) and logged | Within 30 days of determination (enforced by `indemnification.payment_due_at`) |

**ALERTS/METRICS:** Alert when a permissive indemnification determination has not been made within 45 days of complete submission. Alert if federal screen flags a potential bar. Metric: count of permissive indemnification requests decided per year, with outcome (approved/denied); report to Board annually.

---

## RII-05 — Advancement of Expenses {#rii-05-advancement-of-expenses}

**WHY (Reg cite):** [California Corporations Code §317(f)](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=317.&lawCode=CORP) permits advancement of expenses incurred in defending a proceeding upon receipt of an undertaking to repay if it is ultimately determined that the agent is not entitled to indemnification. Advancement is subject to the federal payment restrictions of [12 CFR Part 359](https://www.ecfr.gov/current/title-12/part-359) and [12 U.S.C. §1828(k)](https://www.law.cornell.edu/uscode/text/12/1828).

**SYSTEM BEHAVIOR:** An official may request advancement of defense costs before final resolution of a proceeding. The request must be accompanied by a written undertaking to repay all advanced amounts if it is ultimately determined that the official is not entitled to indemnification. The CCO reviews the undertaking for adequacy, runs a federal screen, and, if both are satisfactory, authorizes advancement. Advances are tracked against the defense budget; invoices are reviewed before each disbursement. If indemnification is ultimately denied, the CCO initiates repayment demand. Write access to advancement authorization is restricted to the CCO and Legal.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Official requests advancement of defense costs (`indemnification.advance.decided`) | Official identity (`official.id`), matter description (`indemnification.request`), written undertaking to repay (`indemnification.undertaking`), defense invoice (`indemnification.defense_invoice`) | Advancement request received; undertaking logged; federal screen initiated | Within 5 BD of receipt |
| Federal screen completed — advancement authorized (`indemnification.federal_screen.completed`) | Federal screen result (`indemnification.federal_screen_result`), enforcement status (`indemnification.enforcement_status`), undertaking confirmed | Screen result logged; advancement authorized (`indemnification.advance.decided`) | Within 5 BD of undertaking receipt (enforced by `indemnification.advance_due_at`) |
| Advancement disbursed (`indemnification.advance.disbursed`) | Authorized advancement, defense invoice, advance balance (`indemnification.advance_balance`), official payment account (`official.payment_account`) | Disbursement logged (`indemnification.advance.disbursed`) | Within 10 BD of authorization |
| Final resolution — repayment demanded if indemnification denied (`indemnification.repayment.demanded`) | Final determination record (`indemnification.decision.recorded`), advance balance (`indemnification.advance_balance`) | Repayment demand issued and logged (`indemnification.repayment.demanded`) | Within 15 BD of final determination |

**ALERTS/METRICS:** Alert when an advancement request has been pending federal screen for more than 5 BD. Track total outstanding advance balance per matter; alert if balance exceeds approved defense budget. Metric: count of repayment demands issued; target zero unrecovered advances after final denial.

---

## RII-06 — Indemnification Exclusions {#rii-06-indemnification-exclusions}

**WHY (Reg cite):** [California Corporations Code §317(b)](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=317.&lawCode=CORP) prohibits indemnification where the agent did not act in good faith or did not reasonably believe the action was in the corporation's best interest; §317(c) prohibits indemnification in criminal matters where the agent had reasonable cause to believe the conduct was unlawful. [12 CFR Part 359](https://www.ecfr.gov/current/title-12/part-359) and [12 U.S.C. §1828(k)](https://www.law.cornell.edu/uscode/text/12/1828) impose additional federal prohibitions on indemnification payments to institution-affiliated parties by troubled or failing institutions and in connection with certain enforcement actions.

**SYSTEM BEHAVIOR:** The system enforces a hard block on indemnification payments in any of the following circumstances: (1) the official acted in bad faith; (2) the official knowingly violated the law; (3) the conduct constituted a breach of the duty of loyalty to Pynthia; (4) the transaction involved improper personal benefit to the official; or (5) payment is barred by 12 CFR Part 359 or 12 U.S.C. §1828(k). The federal screen (run before every payment under RII-03, RII-04, and RII-05) is the primary enforcement mechanism for exclusion (5). Exclusions (1)–(4) are evaluated as part of the conduct-standard determination under RII-04. A payment blocked by any exclusion is logged as `indemnification.payment.blocked` with the exclusion basis recorded. Write access to exclusion determinations is restricted to Legal and the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Federal screen run before any indemnification or advancement payment (`indemnification.federal_screen.completed`) | Enforcement status (`indemnification.enforcement_status`), federal screen result (`indemnification.federal_screen_result`), matter description | Screen completed and logged (`indemnification.federal_screen.completed`); if bar detected, flagged (`indemnification.federal_screen.flagged`) | Before any payment disbursed; within 5 BD of payment authorization |
| Exclusion basis identified — payment blocked (`indemnification.payment.blocked`) | Exclusion basis (bad faith, knowing violation, loyalty breach, improper personal benefit, or federal bar), conduct record (`indemnification.conduct_record`), legal review (`indemnification.legal_review`) | Payment blocked and logged (`indemnification.payment.blocked`); official notified; exclusion basis recorded | Immediately on determination |

**ALERTS/METRICS:** Alert immediately on any `indemnification.federal_screen.flagged` event. Alert if any payment is disbursed without a completed federal screen (target: zero). Metric: count of payments blocked by exclusion per year; report to Board annually.

---

## RII-07 — Decision Process and Conflicts {#rii-07-decision-process-and-conflicts}

**WHY (Reg cite):** [California Corporations Code §317(e)](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=317.&lawCode=CORP) specifies that the conduct-standard determination for permissive indemnification must be made by: (1) a majority vote of a quorum of disinterested directors, (2) independent legal counsel in a written opinion if a disinterested quorum cannot be obtained, or (3) the members. Conflict-of-interest recusal is required to preserve the integrity of the decision. Federal restrictions under [12 CFR Part 359](https://www.ecfr.gov/current/title-12/part-359) and [12 U.S.C. §1828(k)](https://www.law.cornell.edu/uscode/text/12/1828) apply regardless of the decision body's determination.

**SYSTEM BEHAVIOR:** When a permissive indemnification request is received, the CCO identifies the appropriate decision body in the following order: (1) a quorum of disinterested directors (`board.disinterested_quorum`); if unavailable, (2) independent legal counsel opinion (`indemnification.counsel_opinion`); if neither is available, (3) a vote of the members. Any director or officer who is the subject of the indemnification request, or who has a material interest in the outcome, must recuse and the recusal must be recorded (`indemnification.recusal_record`, `coi.recusal.logged`). The decision body's selection and composition are logged before the determination is made. This control cross-references the Director Fiduciary Duties Policy and the Conflict-of-Interest framework for recusal standards. Write access to decision-body selection and recusal records is restricted to the CCO and Legal.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Permissive indemnification request routed to decision body (`indemnification.request.routed`) | Official identity (`official.id`), matter description (`indemnification.request`), director roster, conflict-of-interest disclosures (`coi.questionnaire_responses`) | Decision body selected and logged (`indemnification.decision_body.selected`); disinterested quorum confirmed or counsel engaged | Within 10 BD of request receipt |
| Interested official recuses (`coi.recusal.logged`) | Interested official identity, matter reference (`coi.matter_reference`), recusal record (`indemnification.recusal_record`) | Recusal logged (`coi.recusal.logged`); recusal record attached to indemnification file (`indemnification.recusal_record`) | Before any deliberation or vote |
| Decision body makes determination (`indemnification.decision.recorded`) | Conduct record (`indemnification.conduct_record`), counsel opinion if applicable (`indemnification.counsel_opinion`), disinterested quorum confirmation (`board.disinterested_quorum`), recusal records | Determination recorded (`indemnification.decision.recorded`); decision body composition and vote logged | Within 60 days of complete submission (enforced by `indemnification.determination_due_at`) |

**ALERTS/METRICS:** Alert when a decision body has not been convened within 10 BD of request routing. Alert if a determination is recorded without a recusal record for any interested official. Metric: time from request receipt to determination; target ≤ 45 days median.

---

## RII-08 — Claims Procedures {#rii-08-claims-procedures}

**WHY (Reg cite):** Insurance policy conditions universally require timely notice of claims and potential claims as a condition of coverage. Failure to provide timely notice can void coverage. Sound governance and the indemnification framework require document preservation and controlled communications to protect both the official and the institution. These obligations arise from the insurance contracts maintained under [RII-02](#rii-02-insurance-program-maintenance) and are reinforced by the indemnification framework under California Corporations Code §317.

**SYSTEM BEHAVIOR:** When any director, officer, committee member, or volunteer official becomes aware of a claim, threatened claim, lawsuit, regulatory inquiry, or circumstance that could give rise to a claim covered by any policy maintained under RII-02, they must notify the CCO within 2 business days. The CCO is responsible for: (1) notifying the relevant carrier(s) within the policy-specified notice period; (2) issuing a document preservation directive; (3) coordinating with Legal on controlled communications (no admissions, no unauthorized statements to claimants or regulators); and (4) opening an indemnification matter if the official may seek indemnification. All claim-related communications are routed through Legal. Write access to claim notification records is restricted to the CCO and Legal.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Official learns of claim or potential claim and notifies CCO (`indemnification.claim.notified`) | Official identity (`official.id`), claim description (`claim.record_scope`), date of awareness, relevant policy lines | Claim notification logged (`indemnification.claim.notified`); carrier notice task created (`claim.carrier_notice_due_at`) | Official notifies CCO within 2 BD of awareness |
| Carrier notice sent (`insurance.carrier_notice.sent`) | Claim description, policy number, coverage line, carrier contact | Carrier notice sent and logged (`insurance.carrier_notice.sent`) | Within policy-specified notice period (internal: 5 BD from CCO notification; enforced by `claim.carrier_notice_due_at`) |
| Document preservation directive issued (`record.hold.placed`) | Matter reference (`legal.matter_id`), scope of records to be preserved (`legal.hold_scope`), custodians identified | Legal hold placed (`record.hold.placed`); hold scope logged | Within 2 BD of claim notification |
| Claim matter resolved or closed (`claim.matter.closed`) | Resolution record (`claim.resolution_record`), carrier confirmation, legal hold release authorization | Matter closed (`claim.matter.closed`); legal hold released (`record.hold.released`) if no further litigation | On final resolution |

**ALERTS/METRICS:** Alert when a carrier notice task (`claim.carrier_notice_due_at`) is within 1 BD of the policy deadline and has not been sent. Alert if a claim notification is received without a corresponding document preservation directive within 2 BD. Metric: time from CCO notification to carrier notice; target 100% within policy deadline.

---

## RII-09 — Recordkeeping {#rii-09-recordkeeping}

**WHY (Reg cite):** Sound governance and regulatory examination readiness require that reimbursement approvals, insurance program records, and indemnification decisions be retained for periods sufficient to support audit, litigation, and regulatory review. California Corporations Code §317 matters may be subject to statutes of limitations extending many years; indemnification records are typically retained permanently. Insurance policies and claims records are retained for the life of the policy plus the applicable claims period. Reimbursement records are retained consistent with general financial record requirements.

**SYSTEM BEHAVIOR:** The system assigns retention classes to records produced by each control in this policy at the time of creation. Reimbursement approvals and supporting receipts are retained for 7 years from the date of approval. Insurance policies, coverage schedules, and claims records are retained for the life of the policy plus 10 years (or permanently if a claim remains open). Indemnification decisions, conduct records, counsel opinions, undertakings, and payment records are retained permanently. Legal holds placed under RII-08 suspend the retention clock for affected records until the hold is released. The CCO is responsible for ensuring records are indexed and retrievable for examination. Write access to retention class assignments is restricted to the CCO and the Records function; destruction requires CCO sign-off and confirmation that no legal hold is active.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Expense report decided (approved or denied) (`official.expense_report.decided`) | Expense report (`expense.report_id`), approval or denial record, receipts | Record created with retention class "7 years" (`record.created`); retention clock set (`record.retention_clock_set`) | At time of decision |
| Insurance policy bound or renewed (`insurance.policy.bound`) | Policy document, coverage schedule (`insurance.coverage_schedule`), carrier confirmation | Record created with retention class "life of policy + 10 years" (`record.created`); retention clock set (`record.retention_clock_set`) | At time of binding |
| Indemnification decision recorded (`indemnification.decision.recorded`) | Decision record, conduct record (`indemnification.conduct_record`), counsel opinion (`indemnification.counsel_opinion`), undertaking (`indemnification.undertaking`), payment record | Record created with retention class "permanent" (`record.created`); retention clock set (`record.retention_clock_set`) | At time of decision |
| Legal hold placed on indemnification or claim records (`record.hold.placed`) | Matter reference (`legal.matter_id`), hold scope (`legal.hold_scope`), hold authorizer (`record.hold_authorizer`) | Legal hold placed (`record.hold.placed`); retention clock suspended | Immediately on claim notification (see RII-08) |
| Legal hold released (`record.hold.released`) | Hold release authorization (`record.hold_release_auth`), matter closure confirmation | Hold released (`record.hold.released`); retention clock resumed (`record.retention_clock_set`) | On final resolution of matter |

**ALERTS/METRICS:** Alert when any indemnification or insurance record approaches scheduled destruction without CCO sign-off. Alert if a record subject to a legal hold is flagged for destruction (`record.disposal_eligible` = true while `record.legal_hold_flag` is active). Annual metric: zero unauthorized destructions of records in this policy's scope.

---

## Governance & Sign-Off {#governance}

| Role | Responsibility |
|---|---|
| **Patrick Wilson, Chief Compliance Officer** | Policy owner; approves all reimbursements above threshold; owns indemnification process; coordinates with Legal and broker |
| **Board of Directors** | Approves policy; ratifies annual insurance program; serves as decision body for permissive indemnification where a disinterested quorum exists |
| **Legal Counsel** | Provides independent opinion for permissive indemnification when disinterested quorum unavailable; reviews all claim communications; confirms mandatory indemnification eligibility |
| **Insurance Broker / Risk Function** | Maintains coverage schedule; advises on program adequacy; coordinates carrier notices |

**Review cadence:** Annual review by the CCO, with Board ratification. Triggered review upon any material claim, regulatory change, or change in Pynthia's financial condition that could implicate 12 CFR Part 359.

**Cross-references:**
- Director Fiduciary Duties Policy (duty-of-care and duty-of-loyalty standards; conflict-of-interest recusal rules)
- Third-Party Risk Policy (insurance broker and vendor oversight)
- Record Retention Policy (retention periods and destruction procedures)
- Conflict-of-Interest Policy (recusal framework referenced in RII-07)

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The `official`, `indemnification`, `insurance`, `expense`, `claim`, and related object fields and events referenced throughout this document are drawn from the registered Cassandra Banking Core API vocabulary where registered codes exist (e.g., `indemnification.*`, `insurance.*`, `expense.*`, `official.*`, `claim.*`, `record.*`, `coi.*`, `board.*`). All codes used are registered or composed per the Composition grammar. No new objects or actions were minted. Any field cited that is not yet confirmed in `core-vocabulary.json` for the lending/governance domain is flagged as provisional and will be confirmed by engineering before the next review.

- **Threshold schedule for pre-approval is not defined.** PATRICK_NOTES require pre-approval "above defined thresholds" but do not specify the dollar amounts. This policy assumes the threshold schedule is maintained as a separate Board-approved exhibit. The CCO must confirm and publish the threshold schedule before this policy is effective.

- **Specific insurance carriers, coverage limits, and deductibles are not specified.** The policy references the coverage schedule as the authoritative source. Actual carriers, limits, deductibles, and policy numbers must be confirmed against Pynthia's current program and recorded in the coverage schedule before this policy is finalized.

- **DFPI fidelity-bond minimum amount is not specified.** The policy references the DFPI minimum as a field (`insurance.dfpi_minimum`) but the specific dollar amount applicable to Pynthia's asset size must be confirmed with the DFPI or the insurance broker and recorded in the coverage schedule.

- **Bylaw indemnification language has not been reviewed.** This policy operationalizes indemnification "within the limits permitted by law" and consistent with Pynthia's articles and bylaws. The specific bylaw language must be reviewed by Legal to confirm it authorizes the mandatory and permissive indemnification commitments described here, and to confirm whether member approval is required for any permissive indemnification decisions.

- **12 CFR Part 359 applicability assumed but not currently triggered.** Pynthia is assumed not to be in "troubled condition" as defined by 12 CFR Part 359. The federal screen control (RII-06) is designed to catch any change in condition. If Pynthia's condition changes, the CCO must immediately reassess all pending indemnification and advancement payments.

- **California Corporations Code §317 applicability to credit unions.** Pynthia is a state-chartered credit union. The policy assumes §317 applies by virtue of Pynthia's articles and bylaws incorporating its standards. Legal should confirm whether the California Credit Union Law (Financial Code §14000 et seq.) modifies or supplements §317 for credit unions specifically.

- **Retention periods are policy assumptions.** The 7-year period for reimbursement records and the "permanent" classification for indemnification decisions are governance assumptions consistent with best practice. The Record Retention Policy governs; if it specifies different periods, those govern and this policy should be updated to cross-reference them.

- **Volunteer officials scope.** PATRICK_NOTES include "volunteers" in scope. The policy applies this term to mean volunteer committee members and other unpaid officials serving in an official capacity. The CCO should confirm with Legal whether volunteer officials are "agents" within the meaning of California Corporations Code §317 and whether the indemnification commitment extends to them without modification.

- **Single approver.** The policy currently lists Patrick Wilson as both owner and sole approver. Best practice requires at least one additional approver (e.g., Board Chair or Audit Committee Chair) for a policy governing payments to officials. This gap should be resolved before the policy is finalized.
```
