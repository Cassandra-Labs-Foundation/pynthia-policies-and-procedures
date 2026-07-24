# Truth in Savings Policy — Summary

> This document serves two purposes:
> 1. A plain-language summary of our Truth in Savings Policy that a regulator or
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

Pynthia Credit Union complies with the Truth in Savings Act and its implementing Regulation DD (12 CFR Part 1030) by disclosing the terms of deposit accounts to consumers in a clear and conspicuous form they can keep, governing the advertising of deposit accounts, and meeting disclosure requirements for overdraft programs. The policy applies to all deposit accounts offered to consumers across all delivery channels (paper, electronic, and in-person) and to all employees who open accounts, calculate interest, prepare disclosures, or create advertising.

## 2. Key Regulatory Authorities

- **Truth in Savings Act / Regulation DD (12 CFR Part 1030)** — General disclosure, account-opening, subsequent-change, maturity, periodic-statement, interest-calculation, advertising, recordkeeping, and overdraft-service disclosure requirements; applies regardless of charter.
- **Regulation DD §1030.11** — Overdraft-service disclosures, including aggregate fee totals on periodic statements and balance disclosures through automated systems.
- **Regulation E §1005.17 (12 CFR Part 1005)** — Affirmative opt-in requirement for ATM and one-time debit-card overdraft fees, which intersects with Reg DD overdraft disclosures.
- **California Financial Code (§851 et seq.)** — Parallel state-level deposit-disclosure requirements for state-chartered institutions.
- **CCFPL / UDAAP** — DFPI examination of truth-in-savings disclosures for deceptive practices.

## 3. What This Policy Must Cover

Truth-in-savings risk concentrates wherever a consumer relies on a stated rate, yield, fee, or "free" claim — at account opening, in advertising, on periodic statements, and around overdraft programs — because an inaccurate or late disclosure is both a Reg DD violation and a UDAAP exposure. The policy must operationalize disclosure content, timing, and review, and define who approves disclosure and advertising changes.

The policy must establish the following controls:

**(a) Disclosure Standards.** Provide deposit-account disclosures that are accurate, clear and conspicuous, and reflect the deposit contract, with defined content, format, language, and delivery channels (paper, electronic with E-SIGN consent, or in-person).

**(b) Pre-Opening Account Disclosures.** Deliver required account disclosures (APY, interest rate, compounding/crediting, minimum-balance requirements, fees, and transaction limitations) before an account is opened or a service is provided, or within 10 business days if the consumer is not present.

**(c) Subsequent (Change-in-Terms) Disclosures.** Mail or deliver advance notice at least 30 calendar days before the effective date of any change that reduces the APY or otherwise adversely affects the consumer, including the effective date.

**(d) Maturity Notices.** Send maturity/renewal notices shortly before the maturity of automatically renewable (rollover) certificates and similar notices for long-term non-renewing accounts, with timing keyed to the account term.

**(e) Periodic Statement Disclosures.** Where periodic statements are provided, include the required Reg DD content (e.g., APY earned, interest, fees, and days in period).

**(f) Interest Calculation.** Pay interest on the full principal balance each day using a permitted method (daily balance or average daily balance), and document the APY/APYE formula and when interest begins to accrue.

**(g) Advertising Review.** Require pre-publication review of deposit advertising across all media (including online and social) to ensure it is not inaccurate or misleading, applies the "free"/"no cost" rules, and discloses required additional terms when rates or bonuses are advertised.

**(h) Overdraft Service Disclosures.** Aggregate and disclose overdraft and returned-item fee totals on periodic statements per §1030.11, coordinate advertising and automated-system balance disclosures, and align with the Reg E §1005.17 opt-in for ATM/one-time debit overdraft fees.

**(i) Recordkeeping.** Retain evidence of compliance with Regulation DD for at least 2 years (cross-reference Record Retention Policy).

**(j) Training and Monitoring.** Provide annual training to front-line staff, conduct internal monitoring and periodic audit of disclosures and advertising, and define escalation when a disclosure error is found.

Governance of these controls is centralized with the Chief Compliance Officer, with deposit operations, marketing/advertising review, and front-line staff as required participants.

## 4. Out of Scope

- The Regulation E ATM/one-time-debit overdraft opt-in process itself — see Compliance Policy and Electronic Payment Systems Policy.
- Electronic-delivery channels and E-SIGN consent mechanics — see E-Commerce Policy and Privacy Policy.
- Account-opening identity verification and CIP — see BSA Policy.
- The retention schedule that holds the 2-year Reg DD records — see Record Retention Policy.
- The broader UDAAP examination framework and advertising-review process — see Compliance Policy.
- General member account servicing — see Member Policy.

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
(deposits, transfers, cards, BSA). Truth-in-savings-specific entities and events such as account-disclosure delivery records and templates, APY/APYE calculation parameters, change-in-terms and CD maturity notices, advertising-review approvals, and overdraft fee-aggregation and Reg E opt-in linkage are likely sparse or missing in a banking-core spec, so the regenerator must mark them `(Assumption—needs confirmation)` per the meta-prompt's MISSING INFO HANDLING rule.

## 6. Local Overrides to the Shared Meta-Prompt

{{Usually empty. Put anything here that should override the shared
`meta-prompt.md` for THIS policy only — a different control-ID prefix,
extra required sections, a specific citation style, etc. The regeneration
task applies overrides AFTER the shared meta-prompt, so instructions here
win.}}
