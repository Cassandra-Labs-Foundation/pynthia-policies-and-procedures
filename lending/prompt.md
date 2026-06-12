# Lending Policy — Summary

> This document serves two purposes:
> 1. A plain-language summary of our Lending Policy that a regulator or
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

This policy governs how Pynthia Credit Union extends credit, requiring all acceptance and denial decisions to be made on a safe-and-sound, non-discriminatory basis using only neutral creditworthiness factors. It applies to all credit products and channels — direct, fintech-partner, and white-label/BaaS programs — and serves as the design spec for Pynthia's lending systems and partner integrations. Steering, discriminatory product placement, and preferential insider loans are prohibited.

## 2. Key Regulatory Authorities

- **ECOA / Regulation B (12 CFR Part 1002)** — prohibited-basis discrimination, application and evaluation rules, Government Monitoring Information (§1002.13), action-taken notices and timing (§1002.9), appraisal delivery (§1002.14), and recordkeeping (§1002.12).
- **Fair Housing Act (42 USC §3605)** and **NCUA 12 CFR §701.31** — nondiscrimination in dwelling-secured credit and anti-redlining.
- **TILA / Regulation Z (12 CFR Part 1026)** — ATR/QM for closed-end 1–4 family dwelling-secured consumer credit (§1026.43), advertising (§1026.24), HPML (§1026.35), and loan-originator compensation and anti-steering (§1026.36(d),(e)).
- **HMDA / Regulation C (12 CFR Part 1003)** — data collection and recordkeeping for certain dwelling-secured credit (§1003.5).
- **FCRA (15 USC §1681m, §615(a))** — adverse-action notice content based on credit reports/scores and recordkeeping expectations.
- **BSA / OFAC (31 CFR Chapter V; FFIEC BSA/AML Manual)** — sanctions screening of members and obligors.
- **NCUA Parts 701, 741, 748** — safety and soundness, reporting, security, and insider-practice expectations.

## 3. What This Policy Must Cover

Lending risk at Pynthia is concentrated in fair-lending exposure across products, channels, and partner programs; in the integrity of acceptance/denial and adverse-action decisioning; and in the pricing, valuation, exception, and insider-conflict controls that keep credit decisions neutral and defensible.

The policy must establish the following controls:

**(a) Governance, Roles & Program Scope.** Map each lending and fair-lending control to an owner, tag every product/program (including BaaS partners) with scope flags, restrict credit-parameter and pricing changes to authorized roles, and review the policy at least annually with governance mapping updated within 30 days of any new product/program.

**(b) Product Eligibility & Prohibited Practices.** Maintain a machine-readable "credit box" per product (collateral, LTV, terms) and block applications for explicitly prohibited products (payday, vehicle-title, tax RALs, defined private education loans, stated-income/no-doc), reviewing the credit box at least annually.

**(c) Applications, Acceptance & Denial Standards.** Enforce a standardized underwriting bundle (application data, credit, income/assets, DTI, collateral/LTV, OFAC, ATR/QM) summarized into a CAR-equivalent object, basing decisions on neutral factors only, with completed applications decided within 30 days (ECOA).

**(d) Credit Scoring & Adverse Credit History.** Use empirically derived scores as a secondary check, not the sole driver; apply configurable FICO bands and derogatory-credit tolerances (e.g., bankruptcy seasoning, small medical judgments) with exception routing; require credit reports no older than 6 months at decision; and support alternative credit data for thin-file borrowers.

**(e) ATR/QM & Mortgage Underwriting.** For covered closed-end 1–4 family dwelling-secured loans, require the ATR 8-factor checklist and QM classification, apply a 43% consumer DTI default with capacity for stricter configurable tiers (e.g., 35% mortgage), and complete the ATR checklist before docs print.

**(f) Appraisals, Valuations & Collateral.** Enforce appraisal independence and an approved-appraiser list, auto-generate and promptly deliver free appraisal copies for first-lien dwellings (retained ≥25 months), and enforce configurable product LTV matrices.

**(g) Adverse Action & Notifications.** Enforce ECOA/Reg B and FCRA adverse-action content and timing (30 days for completed applications and existing-account AA; 90 days post-counteroffer if not accepted) and require second-level review of all denials for consistency and fair-lending concerns.

**(h) Exceptions, Mitigating Factors & Overrides.** Automatically detect breaches of numeric/qualitative rules (DTI, FICO, LTV, bankruptcy seasoning, product restrictions), require standardized mitigant selection and approval routing, decide exceptions before closing, and produce portfolio-level exception analytics.

**(i) Documentation, Recordkeeping & Retention.** Enforce a credit-package schema for every loan and prequal, require all docs before booking, and apply retention of ≥25 months for applications, GMI, evaluation data, and AA notices (longer per CU standard).

**(j) Pricing, Rate Sheets & HPML Controls.** Maintain weekly APOR-tied rate sheets, run HPML and points-and-fees tests on covered mortgages before docs, and enforce a pricing-exception workflow with mitigants and approvals across direct and partner pricing engines.

**(k) OFAC & Sanctions Gate.** Screen all new borrowers, co-borrowers, and guarantors before closing, require clearance before funding, and capture override rationale when an apparent match is cleared.

**(l) Prequalification, Marketing & Steering Controls.** Base prequalification on neutral documented criteria, prohibit steering into less favorable products by prohibited bases or proxies, and ensure online and partner product menus do not discourage protected groups.

**(m) Fair Lending Risk Assessment & Monitoring.** Maintain reproducible app, approval, denial, pricing, and loss data with GMI by product, channel, partner, and geography, run a full fair-lending risk assessment at least annually, and track remediation.

**(n) Insider Lending & Employee Conflicts.** Implement a no-preferential-terms posture for employees, officers, directors, and related parties; tag and resolve insider flags before decision; never apply looser underwriting or pricing; and report insider/employee lending activity to governance.

Governance of these controls is centralized with the Chief Compliance Officer (as Fair Lending Officer), with the Chief Lending Officer, Loan Operations, underwriting, BSA/Compliance, and the Board (or Lending/Fair Lending Committee) as required participants.

## 4. Out of Scope

- Non-accrual, charge-off, and delinquency-collection workflow specifics — see Collections Policy.
- BSA/AML program governance beyond the lending OFAC gate — see BSA Policy.
- General fair-lending program governance and analytics methodology — see Fair Lending Policy.
- Member eligibility, onboarding, and CIP identity verification — see Member and BSA Policies.
- Truth-in-Savings deposit disclosures — see Truth-in-Savings Policy.
- Record retention schedules generally — see Record Retention Policy.
- Fintech/BaaS partner onboarding and ongoing vendor due diligence — see Third-Party Risk Policy.

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
(deposits, transfers, cards, BSA). Loan-origination and fair-lending entities and events — applications, underwriting bundles, credit reports, ATR/QM checklists, appraisals, adverse-action notices, pricing/HPML tests, GMI, and exception records — are likely sparse or absent in a banking-core spec, so the regenerator must mark them `(Assumption—needs confirmation)` per the meta-prompt's MISSING INFO HANDLING rule.

## 6. Local Overrides to the Shared Meta-Prompt

{{Usually empty. Put anything here that should override the shared
`meta-prompt.md` for THIS policy only — a different control-ID prefix,
extra required sections, a specific citation style, etc. The regeneration
task applies overrides AFTER the shared meta-prompt, so instructions here
win.}}
