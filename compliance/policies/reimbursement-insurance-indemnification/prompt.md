# Reimbursement, Insurance, and Indemnification of Officials Policy — Summary

> This document serves two purposes:
> 1. A plain-language summary of our Reimbursement, Insurance, and Indemnification of Officials Policy that a regulator or
>    examiner can read end-to-end in a few minutes.
> 2. The canonical input that our regeneration task feeds into the shared
>    meta-prompt to produce the full Table-First, Design-Overlay v2 policy
>    document.
>
> Edit this file directly when the policy's substance, scope, or ownership
> changes. The regenerated long-form policy is rebuilt from this summary plus
> the reference documents in `references/`.

---

## Organization and Ownership

**Organization:** Pynthia Credit Union
**Policy Owner:** Patrick Wilson, Chief Compliance Officer
**Approvers:**
- Patrick Wilson, Chief Compliance Officer

## 1. Purpose and Scope

Pynthia Credit Union governs the reimbursement of reasonable business expenses incurred by directors, officers, committee members, and volunteers; the insurance program maintained to protect those officials and the institution; and the circumstances under which officials are indemnified for liabilities arising from their service. The policy applies to all directors, officers, committee members, and volunteer officials, and operationalizes the indemnification commitments in Pynthia's articles and bylaws within the limits permitted by law. Specific insurance carriers, coverage limits, and bylaw language must be confirmed against Pynthia's actual program before this policy is finalized.

## 2. Key Regulatory Authorities

- **California Corporations Code §§204(a)(10), 317** — Corporate framework for permissive and mandatory indemnification, advancement of expenses, and authorizing indemnification in the articles/bylaws.
- **FDIC Part 359 (12 CFR Part 359)** — Restrictions on golden-parachute and indemnification payments by troubled institutions; the policy must comply even though Pynthia is not currently in troubled condition.
- **12 USC §1828(k)** — Federal restrictions on indemnification payments to institution-affiliated parties.
- **DFPI fidelity-bond requirements** — Minimum fidelity-bond coverage for state-chartered institutions.

## 3. What This Policy Must Cover

Risk concentrates at the point where personal liability of an official meets institutional funds: paying expenses that should not be reimbursed, indemnifying conduct the law forbids indemnifying, or carrying insurance gaps that leave directors and the institution exposed. The policy must set clear standards, decision rights, and conflict-of-interest recusal so that reimbursement, coverage, and indemnification decisions are defensible and compliant.

The policy must establish the following controls:

**(a) Business Expense Reimbursement.** Define reimbursable categories (travel, lodging, meals, education/training, board materials), require a reasonable-and-customary standard, original receipts, and pre-approval above defined thresholds, with exclusions for personal or unsupported expenses.

**(b) Insurance Program Maintenance.** Identify and maintain the coverages carried for officials and the institution — Directors & Officers (D&O) liability (with Side A/B/C breakdown), Errors & Omissions, the required fidelity bond, cyber liability, and Employment Practices Liability — specifying limits, deductibles, claims-made vs. occurrence basis, and who is covered, reviewed at least annually.

**(c) Mandatory Indemnification.** Indemnify a director or officer who is successful on the merits in defending a claim arising from their service, to the extent required by the bylaws and California Corporations Code §317.

**(d) Permissive Indemnification.** Permit indemnification for settlements or adverse judgments only where the official met the applicable standard of conduct (good faith and a reasonable belief the action was in the institution's best interest), subject to the statutory standards.

**(e) Advancement of Expenses.** Allow advancement of defense costs before final resolution upon a written undertaking to repay if indemnification is ultimately not permitted.

**(f) Indemnification Exclusions.** Prohibit indemnification for bad faith, knowing violations of law, breach of the duty of loyalty, transactions involving improper personal benefit, and any payment barred by FDIC Part 359 or 12 USC §1828(k).

**(g) Decision Process and Conflicts.** Specify who decides indemnification claims (disinterested directors, independent legal counsel opinion, or members as applicable) and require interested officials to recuse, cross-referencing the conflict-of-interest framework.

**(h) Claims Procedures.** Define timely notification to carriers, cooperation, document preservation, and controlled communications when a claim or potential claim arises.

**(i) Recordkeeping.** Retain reimbursement approvals, insurance policies, and indemnification decisions per the retention schedule (D&O matters typically retained permanently).

Governance of these controls is centralized with the Chief Compliance Officer, with the Board, the insurance broker/risk function, and Legal as required participants.

## 4. Out of Scope

- The fiduciary duty-of-care and duty-of-loyalty standards that trigger indemnification analysis, and conflict-of-interest recusal rules — see Director Fiduciary Duties Policy.
- Selection and oversight of the insurance broker and other vendors — see Third-Party Risk Policy.
- Retention periods and destruction of indemnification and insurance records — see Record Retention Policy.
- Compensation and employee expense policies for non-official staff (no dedicated HR policy in this repository).
- Charitable contributions by the institution — see Charitable Donation Accounts Policy.

## 5. System Design Notes

**This section is resolved dynamically at regeneration time.** The
regenerator must invoke the project-scoped `vocabulary` skill (see
`.skills/vocabulary/SKILL.md` at the project root) and inline its
entire stdout as the `DESIGN_NOTES` input to the shared meta-prompt.
Do not hand-curate event or field names here — the skill is the source
of truth and `core-vocabulary.json` evolves.

**Directive to the regenerator.** Before assembling the INPUTS block,
run the skill's extraction script from the project root:

    python3 .skills/vocabulary/scripts/extract_vocabulary.py

Capture the complete stdout verbatim and use it as `DESIGN_NOTES`. The
skill emits a self-contained Markdown block (per-entity field tables
plus events, endpoints, state machines, and plugins). Do not trim,
summarize, or reorder its output — the meta-prompt decides what is
relevant for the policy.

**Failure handling.** If the script exits non-zero, `core-vocabulary.json`
is missing, or the skill reports a parse error, record the failure in
the run summary and proceed with `DESIGN_NOTES` empty. Never invent
event codes or field names; the Design Overlay v2 blocks must only
cite codes that actually exist in the spec.

**Known state of the spec (as of regeneration time).** The parsed spec
is `Cassandra Banking Core API v1.0.0`, which is banking-core
(deposits, transfers, cards, BSA). Nearly all of this policy's domain entities and events — expense-reimbursement requests and approvals, insurance-policy and fidelity-bond records, indemnification claims and decisions, advancement undertakings, and conflict-of-interest recusals — are governance/HR concerns that are almost certainly absent from a banking-core spec, so the regenerator must mark them `(Assumption—needs confirmation)` per the meta-prompt's MISSING INFO HANDLING rule.

## 6. Local Overrides to the Shared Meta-Prompt

{{Usually empty. Put anything here that should override the shared
`meta-prompt.md` for THIS policy only — a different control-ID prefix,
extra required sections, a specific citation style, etc. The regeneration
task applies overrides AFTER the shared meta-prompt, so instructions here
win.}}
