# Basel II Standardized Approach Framework Policy — Summary

> This document serves two purposes:
> 1. A plain-language summary of our Basel II Standardized Approach Framework Policy that a regulator or
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

This policy establishes a high-level framework for capital adequacy, liquidity management, buffer ratios, and risk weighting, adapting Basel II's three-pillar principles for future-proofing and alignment with NCUA expectations. As a US credit union regulated by the NCUA, Pynthia is not directly subject to Basel II (a 2004 international banking standard), but adopting its principles enhances risk management and prepares for potential harmonization with banking standards. It applies to all assets, liabilities, and off-balance-sheet exposures of the credit union; actual regulatory compliance follows NCUA rules.

## 2. Key Regulatory Authorities

- **Basel II Framework (BIS, "International Convergence of Capital Measurement and Capital Standards," June 2006)** — Pillar 1 minimum capital requirements (paras. 6–659), Pillar 2 supervisory review/ICAAP (paras. 660–709), and Pillar 3 market discipline/disclosures (paras. 800–881); standardized approach risk weights (Table 1, paras. 52–53; CRE Chapter 20).
- **NCUA Capital Adequacy (12 CFR Part 702, esp. §§ 702.2, 702.104, 702.204, 702.304)** — risk-based net worth ratio (RBC ratio = Adjusted Net Worth / Risk-Weighted Assets ≥ 8% for well-capitalized), capital components, risk weights, PCA matrix, and stress testing.
- **NCUA Liquidity (12 CFR § 741.12)** — board-approved written liquidity policy requirement.
- **NCUA Central Liquidity Facility (12 CFR Part 725)** — CLF access (up to 25% of shares).
- **NCUA Letter to Credit Unions 13-CU-10** — liquidity and contingency funding guidance.
- **Basel III supplements (BIS, 2010)** — liquidity standards (LCR/NSFR) and capital buffers adopted here for future-proofing.

## 3. What This Policy Must Cover

Capital and liquidity risk concentrate in maintaining sufficient loss-absorbing capital and stable funding under both normal and stressed conditions. The policy targets ratios exceeding NCUA minima, informed by Basel II's 8% total capital requirement, and provides for monitoring, stress testing, and contingency actions when thresholds are approached.

The policy must establish the following controls:

**(a) Minimum Capital Requirements.** Maintain a Total Risk-Based Capital Ratio ≥ 8% of RWA, a Tier 1 Capital Ratio ≥ 6% of RWA, CET1 ≥ 4.5% of RWA, and a Leverage Ratio ≥ 4% (Tier 1 / total assets). Ratios are calculated quarterly using NCUA's RBC calculator; falling below targets triggers contingency plans (e.g., dividend restrictions, asset sales).

**(b) Components of Capital.** Define Tier 1 capital (retained/undivided earnings, qualifying perpetual preferred; deductions for goodwill and DTAs >10% of Tier 1) and Tier 2 capital (subordinated debt, general loan loss reserves up to 1.25% of RWA, revaluation reserves), with Total Capital = Tier 1 + Tier 2 and specified exclusions.

**(c) Risk-Weighted Assets (RWA).** Compute RWA as the sum of (exposure × risk weight) using the standardized approach for credit risk, operational risk RWA (15% of average annual gross income over 3 years, Basic Indicator Approach), and market risk RWA (standardized method for trading assets >10% of total assets; capital charge = 8% × Market RWA).

**(d) Risk Weight Schedule.** Apply standardized risk weights: 0% cash/government; 20% claims on banks and short-term off-balance-sheet (20% CCF); 50% qualifying 1–4 family residential mortgages (LTV ≤ 80%); 100% commercial/member business loans; 150% loans >90 days past due; 300% high-risk equities/speculative real estate; 1,250% low-rated securitization tranches; with collateral and sovereign adjustments and NCUA-specific weights for CUSOs and derivatives.

**(e) Liquidity Requirements.** Maintain a board-approved written liquidity policy covering sources and uses; target LCR ≥ 100% and NSFR ≥ 100%; produce weekly liquidity position reports; maintain a Contingency Funding Plan covering moderate/severe stress including CLF access; observe a loan-to-share ratio ≤ 85% and funding diversification (<50% from a single source); activate the CFP if liquidity falls below 20% of shares.

**(f) Buffer Ratios.** Adopt a Capital Conservation Buffer of 2.5% of RWA (CET1), bringing combined CET1 ≥ 7%, plus a Countercyclical Buffer of 0–2.5% (activated if credit growth >10%); buffer breaches restrict dividends/payouts (e.g., 60% restriction if buffer <1.25%); the systemic buffer is not applicable to credit unions.

**(g) Pillar 2 ICAAP and Stress Testing.** Perform an annual Internal Capital Adequacy Assessment Process documenting risks beyond Pillar 1 (concentration, interest rate risk) and conduct annual stress tests of defined scenarios (e.g., 20% member share outflow, 10% GDP drop).

**(h) Monitoring, Reporting, and Pillar 3 Disclosures.** ALCO reviews ratios quarterly; annual Pillar 3 disclosures publish capital ratios, RWA breakdown, and risk exposures; report to NCUA via the 5300 Call Report and internally to the Board; if ratios fall below targets, notify the Board within 10 days and implement a recovery plan per the NCUA PCA matrix (§ 702.204); provide annual staff training.

Governance of these controls is centralized with the Chief Compliance Officer, with the Asset-Liability Committee (ALCO), the Chief Financial Officer, and the Board of Directors as required participants.

## 4. Out of Scope

- Secondary capital for low-income designated credit unions (per NCUA rules).
- Advanced risk-weighting approaches (e.g., IRB for credit risk) unless and until NCUA approves.
- Capital planning, capital actions, and PCA category management — see Capitalization Policy.
- Detailed liquidity contingency funding operations — see Liquidity Policy.
- Enterprise risk taxonomy and aggregation — see Enterprise Risk Management Policy.
- Investment portfolio risk weighting at the security level — see Investment Policy.

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
(deposits, transfers, cards, BSA). Capital-adequacy domain entities and events such as risk-weighted-asset computations, regulatory capital tiers, capital/leverage ratios, RBC calculations, buffer triggers, ICAAP, and stress-test scenarios are likely sparse or absent in a banking-core spec, so the regenerator should mark them `(Assumption—needs confirmation)` per the meta-prompt's MISSING INFO HANDLING rule.

## 6. Local Overrides to the Shared Meta-Prompt

{{Usually empty. Put anything here that should override the shared
`meta-prompt.md` for THIS policy only — a different control-ID prefix,
extra required sections, a specific citation style, etc. The regeneration
task applies overrides AFTER the shared meta-prompt, so instructions here
win.}}
