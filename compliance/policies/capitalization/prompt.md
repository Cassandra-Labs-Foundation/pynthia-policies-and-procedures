# Capitalization Policy — Summary

> This document serves two purposes:
> 1. A plain-language summary of our Capitalization Policy that a regulator or
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

This policy establishes Pynthia Credit Union's commitment to maintaining adequate capital to support its activities, meet member needs, absorb losses, and sustain the confidence of members, employees, and regulators. It sets internal capital-ratio targets above regulatory minimums, governs capital planning and stress testing, and defines the actions and escalations to be taken if capital approaches established thresholds. It applies to all capital-impacting decisions across the credit union's balance sheet.

## 2. Key Regulatory Authorities

- **NCUA Capital Adequacy / Prompt Corrective Action (12 CFR Part 702)** — net worth ratio and PCA classifications for federally insured credit unions; well-capitalized threshold is a net worth ratio ≥ 7%.
- **Basel III standardized approach** — the 2.5% capital conservation buffer adopted as an internal standard; risk-weighting methodology applied through the Basel II Standardized Approach Framework Policy.
- **California Financial Code / DFPI minimum capital expectations** — state-chartered minimum capital requirements, which may exceed federal minimums.

## 3. What This Policy Must Cover

Capital risk concentrates in ensuring loss-absorbing capacity stays above regulatory minimums and internal targets across growth, earnings stress, and adverse scenarios, with disciplined planning and timely escalation when ratios approach thresholds.

The policy must establish the following controls:

**(a) Capital Adequacy Targets.** Meet or exceed all standards to be classified well-capitalized under NCUA PCA, and maintain an internal net worth ratio target at or above 7% (the NCUA well-capitalized threshold under 12 CFR Part 702). The net worth ratio is net worth divided by total assets as defined in Part 702.

**(b) Capital Components and Measurement.** Define net worth consistent with 12 CFR § 702.2 (retained earnings and undivided earnings, plus any other amounts includible under Part 702); compute total assets as the average of total assets as reported on the most recent call report.

**(c) PCA Thresholds and Internal Triggers.** Set internal trigger levels above the regulatory PCA thresholds across the five NCUA PCA categories — well-capitalized (≥ 7%), adequately capitalized (≥ 6%), undercapitalized (< 6%), significantly undercapitalized (< 4%), and critically undercapitalized (< 2%) — so that corrective action begins before regulatory minimums are breached.

**(d) Capital Conservation Buffer.** Maintain a 2.5% capital conservation buffer on top of minimum ratios consistent with the Basel III standardized approach, restricting distributions when the buffer is eroded.

**(e) Capital Planning.** The CFO prepares capital projections at least quarterly incorporating anticipated asset growth, earnings trends, dividends, asset quality, economic conditions, and regulatory requirements, with a multi-year forward look presented to the ALM Committee and/or the Board.

**(f) Capital Stress Testing.** Prepare a quarterly capital projection and stress-scenario report (base / adverse / severely adverse) and present it to the ALM Committee and/or Board.

**(g) Quarterly Monitoring and Reporting.** The CFO reviews capital ratios at least quarterly and reports them to the ALM Committee; if ratios approach the established guidelines, management develops a plan to maintain ratios above acceptable levels.

**(h) Contingency Actions and Escalation.** If projections indicate the net worth ratio may fall below the internal target, management considers slowing loan growth, selling loans or securities, reducing operating expenses, and soliciting additional capital; if the net worth ratio may fall below the well-capitalized threshold, management additionally considers selling other assets, mergers/acquisitions, and subordinated debt issuance, and structures real estate loans for secondary-market sale to provide liquidity or reduce assets.

**(i) Capital Actions Governance.** Govern dividend declarations, capital raises (subordinated debt qualifying under NCUA's subordinated debt rule, 12 CFR Part 702 Subpart D), and redemptions, including earnings-based dividend limits and regulatory pre-approval where required.

**(j) Internal Capital Adequacy Assessment (ICAAP).** Perform a risk-based assessment of capital needs beyond regulatory minimums covering concentration, interest rate, and other material risks.

Governance of these controls is centralized with the Chief Compliance Officer, with the Chief Financial Officer, the ALM Committee, and the Board of Directors as required participants.

## 4. Out of Scope

- Risk-weight methodology and detailed RWA calculation tables — see Basel II Standardized Approach Framework Policy.
- Liquidity management and contingency funding plans — see Liquidity Policy.
- Enterprise risk taxonomy under which capital is one risk category — see Enterprise Risk Management Policy.
- Investment portfolio composition and limits — see Investment Policy.

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
(deposits, transfers, cards, BSA). Capitalization-domain entities and events such as regulatory capital tiers, capital/leverage ratio computations, PCA classifications, capital plans, stress-test scenarios, dividend/capital actions, and ICAAP assessments are likely sparse or absent in a banking-core spec, so the regenerator should mark them `(Assumption—needs confirmation)` per the meta-prompt's MISSING INFO HANDLING rule.

## 6. Local Overrides to the Shared Meta-Prompt

{{Usually empty. Put anything here that should override the shared
`meta-prompt.md` for THIS policy only — a different control-ID prefix,
extra required sections, a specific citation style, etc. The regeneration
task applies overrides AFTER the shared meta-prompt, so instructions here
win.}}
